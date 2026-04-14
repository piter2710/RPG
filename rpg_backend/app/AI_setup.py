import google.generativeai as genai
from google.generativeai import types
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from app.settings import settings
import os
import json
from sqlalchemy.future import select
from app.database import AsyncSessionLocal
from app.models import GameState, Stats, Inventory, Journal, Entity, ChatHistory
from app.rpg_functions import (
    roll_skill_check,
    modify_health_and_status,
    manage_inventory,
    update_journal,
    quest_management,
    modify_stats,
    change_location,
    add_entity
)

genai.configure(api_key=settings.gemini_api_key)

game_tools = [
    roll_skill_check,
    modify_health_and_status,
    manage_inventory,
    update_journal,
    quest_management,
    modify_stats,
    change_location,
    add_entity
]

model = genai.GenerativeModel(
    'models/gemini-2.5-flash',
    tools=game_tools,
    safety_settings={
        HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
    }
)

async def generate_fairy_tale_stream():
    """
    An async generator that calls the Gemini API and yields 
    the response in chunks. Perfect for FastAPI's StreamingResponse.
    """
    prompt = "Tell me a simple fairy tale in pure text format."
    
    # generate_content_async with stream=True returns an async generator
    response = await model.generate_content_async(prompt, stream=True)
    
    async for chunk in response:
        # Yield the chunk text as it arrives
        if chunk.text:
            yield chunk.text

import random
from sqlalchemy import delete

async def initialize_game_state(game_place: str = "The Cursed Outskirts"):
    async with AsyncSessionLocal() as db:
        await db.execute(delete(GameState))
        await db.execute(delete(Stats))
        await db.execute(delete(Inventory))
        await db.execute(delete(Journal))
        await db.execute(delete(Entity))
        await db.execute(delete(ChatHistory))
        new_stats = Stats(
            strength=random.randint(8, 18),
            dexterity=random.randint(8, 18),
            constitution=random.randint(8, 18),
            intelligence=random.randint(8, 18),
            wisdom=random.randint(8, 18),
            charisma=random.randint(8, 18)
        )
        base_hp = 50 + (new_stats.constitution * 2)
        new_game_state = GameState(
            current_hp=base_hp,
            max_hp=base_hp,
            current_location=game_place,
            status_effects=""
        )
        
        db.add(new_stats)
        db.add(new_game_state)
        await db.commit()

async def get_system_prompt() -> str:
    rules_path = os.path.join(os.path.dirname(__file__), "rules.txt")
    try:
        with open(rules_path, "r", encoding="utf-8") as f:
            rules = f.read()
    except Exception:
        rules = "Rules file not found."

    async with AsyncSessionLocal() as db:
        game_state_result = await db.execute(select(GameState))
        game_state = game_state_result.scalars().first()
        
        stats_result = await db.execute(select(Stats))
        stats = stats_result.scalars().first()
        
        inventory_result = await db.execute(select(Inventory))
        inventory = inventory_result.scalars().all()
        
        journal_result = await db.execute(select(Journal))
        journal = journal_result.scalars().all()
        
        entities_result = await db.execute(select(Entity))
        entities = entities_result.scalars().all()
        
        prompt = f"=== SYSTEM RULES ===\n{rules}\n\n=== GAME STATE ===\n"
        if game_state:
            prompt += f"HP: {game_state.current_hp}/{game_state.max_hp}, Location: {game_state.current_location}, Status: {game_state.status_effects}\n"
        
        prompt += "\n=== STATS ===\n"
        if stats:
            prompt += f"STR: {stats.strength}, DEX: {stats.dexterity}, CON: {stats.constitution}, INT: {stats.intelligence}, WIS: {stats.wisdom}, CHA: {stats.charisma}\n"
            
        prompt += "\n=== INVENTORY ===\n"
        for item in inventory:
            eq = "Equipped" if item.is_equipped else "Unequipped"
            prompt += f"- {item.name} (x{item.quantity}) [{eq}, Slot: {item.equipment_slot}]\n"
            
        prompt += "\n=== JOURNAL ===\n"
        for entry in journal:
            prompt += f"- [{entry.status.upper()}] {entry.description}\n"
            
        prompt += "\n=== ENTITIES IN SCENE ===\n"
        for ent in entities:
            prompt += f"- {ent.name} (HP: {ent.current_hp}/{ent.max_hp}, Disp: {ent.disposition}, Base Dmg: {ent.base_damage}, DiffMod: {ent.difficulty_modifier})\n"
            
        return prompt

async def generate_campaign_stream(player_input: str):
    system_prompt = await get_system_prompt()
    
    async with AsyncSessionLocal() as db:
        history_result = await db.execute(select(ChatHistory).order_by(ChatHistory.id.asc()))
        history = history_result.scalars().all()
        
    messages = [{"role": "user", "parts": [system_prompt]}]
    
    full_prompt = system_prompt + "\n\n=== CHAT HISTORY ===\n"
    for msg in history:
        full_prompt += f"{msg.role.upper()}: {msg.content}\n\n"
        
    full_prompt += f"USER: {player_input}\n\nMODEL: (Respond based on the above): "
    
    messages = [{"role": "user", "parts": [full_prompt]}]
    
    full_response = ""
    tool_calls = []
    
    try:
        response = await model.generate_content_async(messages, stream=True)
        
        async for chunk in response:
            if chunk.candidates and chunk.candidates[0].content.parts:
                for part in chunk.candidates[0].content.parts:
                    if hasattr(part, 'function_call') and part.function_call:
                        tool_calls.append(part.function_call)
            try:
                if chunk.text:
                    full_response += chunk.text
                    yield chunk.text
            except ValueError:
                pass
                
        if tool_calls:
            # Reconstruct the model's message with the tool calls
            model_parts = [{"function_call": fc} for fc in tool_calls]
            if full_response:
                model_parts.insert(0, {"text": full_response})
                
            messages.append({"role": "model", "parts": model_parts})
            
            # Execute tools and collect responses
            function_responses = []
            is_player_dead = False
            for fc in tool_calls:
                # Reconstruct the arguments as a dictionary from the protobuf map
                args = {k: v for k, v in fc.args.items()}
                func_map = {f.__name__: f for f in game_tools}
                
                if fc.name in func_map:
                    try:
                        result = await func_map[fc.name](**args)
                    except Exception as e:
                        result = {"error": str(e)}
                        
                    # Keep the system execution purely in backend debug/callbacks
                    # We no longer send this raw output back to the user or append to full_response
                    # model will still get it via function_responses
                    pass
                    
                    if isinstance(result, dict) and result.get("outcome") == "PLAYER_DEAD":
                        is_player_dead = True
                    
                    function_responses.append(
                        {"function_response": {"name": fc.name, "response": {"result": result}}}
                    )
            
            if function_responses:
                messages.append({"role": "user", "parts": function_responses})
                
                # Request second response based on tool execution
                followup_response = await model.generate_content_async(messages, stream=True)
                async for chunk in followup_response:
                    try:
                        if chunk.text:
                            full_response += chunk.text
                            yield chunk.text
                    except ValueError:
                        pass
                        
                if is_player_dead:
                    death_notice = "\n[[PLAYER_DEAD]]"
                    full_response += death_notice
                    yield death_notice

    except Exception as e:
        error_msg = f"\n\n[SYSTEM: A connection error occurred with the AI model ({str(e)}). Partial generation saved. Please try your action again.]"
        full_response += error_msg
        yield error_msg

    finally:
        # Save the user's input and the model's output together
        async with AsyncSessionLocal() as db:
            user_message = ChatHistory(role="user", content=player_input)
            model_message = ChatHistory(role="model", content=full_response)
            db.add_all([user_message, model_message])
            await db.commit()

async def start_campaign_stream(game_place: str = "The Cursed Outskirts"):
    await initialize_game_state()
    system_prompt = await get_system_prompt()
    
    first_prompt = (
        f"Respond with the opening scene of the campaign. The player has just awakened in '{game_place}'. "
        "Describe their surroundings, set the grim and perilous tone, and end with a clear, immediate choice they must make. "
        "Do not ask them for their name or background; thrust them directly into the environment."
    )
    
    full_prompt = system_prompt + "\n\n=== CHAT HISTORY ===\nSYSTEM: " + first_prompt + "\n\nMODEL:"
    
    response = await model.generate_content_async(full_prompt, stream=True)
    
    full_response = ""
    async for chunk in response:
        try:
            if chunk.text:
                full_response += chunk.text
                yield chunk.text
        except ValueError:
            continue
            
    async with AsyncSessionLocal() as db:
        model_message = ChatHistory(role="model", content=full_response)
        db.add(model_message)
        await db.commit()

async def generate_random_locations() -> list[dict]:
    prompt = """Generate exactly 3 random, unique, and highly atmospheric starting locations for a text-based RPG.
Return ONLY a valid JSON array of objects. Do not include any markdown formatting like ```json.
Each object must have exactly these keys:
- "id": A short unique string (e.g. "loc_1").
- "title": The name of the location (max 3-4 words).
- "description": A vivid, short description (1-2 sentences) of the place and its atmosphere.
- "buttonLabel": A short action phrase to enter the location (e.g., "Enter the Void", "Take a Seat").
- "themeColor": Must be exactly one of: "primary", "secondary", or "tertiary". Ensure all three locations use a different themeColor.
"""
    try:
        response = await model.generate_content_async(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.9
            )
        )
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        locations = json.loads(text.strip())
        return locations
    except Exception as e:
        print(f"Error generating locations: {e}")
        return [
            {
                "id": "r1",
                "title": "The Cursed Outskirts",
                "description": "Navigate a world of ancient curses and forgotten gods, where every choice carries a heavy price.",
                "buttonLabel": "Enter the Void",
                "themeColor": "primary"
            },
            {
                "id": "r2",
                "title": "Neo-Sumeria",
                "description": "High tech, low life. Jack into the neon-soaked sprawling megalopolis of Neo-Sumeria.",
                "buttonLabel": "Initiate Uplink",
                "themeColor": "secondary"
            },
            {
                "id": "r3",
                "title": "Cozy Tavern",
                "description": "Sometimes the greatest adventure is the one found in a warm hearth and a cold flagon of ale.",
                "buttonLabel": "Take a Seat",
                "themeColor": "tertiary"
            }
        ]

