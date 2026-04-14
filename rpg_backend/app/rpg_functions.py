import random
from app.database import AsyncSessionLocal
from sqlalchemy import select, delete
from app.models import GameState, Stats, Entity, Inventory, Journal, ChatHistory
import math

async def roll_skill_check(
    skill: str,
    dc: int,
    narrative_modifier: int = 0,
    modifier_reason: str = ""
) -> dict:
    """
    Roll a 1d20 skill check against a Difficulty Class (DC).
    
    Args:
        skill: The stat to test (e.g., 'strength', 'dexterity', 'intelligence', 'wisdom', 'charisma', 'constitution').
        dc: The Difficulty Class to beat (5-30).
        narrative_modifier: Bonus or penalty (-5 to +5) based on the story context.
        modifier_reason: Short explanation for why the narrative modifier was applied.
    """
    dc = max(5, min(dc, 30)) 
    narrative_modifier = max(-5, min(narrative_modifier, 5))

    skill_modifier = 0
    # Fetch stats from DB
    async with AsyncSessionLocal() as db:
        stmt = select(Stats)
        result = await db.execute(stmt)
        stats = result.scalars().first()
        
        if stats and hasattr(stats, skill.lower()):
            stat_value = getattr(stats, skill.lower())
            skill_modifier = math.floor((stat_value - 10) / 2)

    roll = random.randint(1, 20)
    total = roll + skill_modifier + narrative_modifier

    if roll == 20:
        result = "Critical Success"
    elif roll == 1:
        result = "Critical Failure"
    elif total >= dc:
        result = "Success"
    else:
        result = "Failure"
    return {
        "skill": skill,
        "natural_roll": roll,
        "skill_modifier": skill_modifier,
        "narrative_modifier": narrative_modifier,
        "total_roll": total,
        "dc": dc,
        "result": result,
        "modifier_reason": modifier_reason
    }
    
from typing import Optional

async def modify_health_and_status(target_id: str, hp_change: int, status_effects: Optional[str] = None) -> dict:
    """
    Modify an entity's or player's hit points and apply status effects.
    
    Args:
        target_id: 'player' or the ID/name of an enemy entity.
        hp_change: Amount to modify HP by (negative for damage, positive for healing).
        status_effects: Optional status condition to add (e.g. 'POISONED', 'STUNNED', 'BLESSED').
    """
    async with AsyncSessionLocal() as db:
        if target_id == "player":
            stmt = select(GameState)
            result = await db.execute(stmt)
            game_state = result.scalars().first()
            
            if not game_state:
                return {"error": "Game state not found"}
            
            game_state.current_hp = max(0, min(game_state.current_hp + hp_change, game_state.max_hp))
            
            if status_effects:
                new_effect = status_effects.strip().upper()
                if game_state.status_effects:
                    current_effects = [e.strip().upper() for e in game_state.status_effects.split(",") if e.strip()]
                    if new_effect not in current_effects:
                        current_effects.append(new_effect)
                        game_state.status_effects = ", ".join(current_effects)
                else:
                    game_state.status_effects = new_effect
            
            if game_state.current_hp <= 0:
                await db.execute(delete(GameState))
                await db.execute(delete(Stats))
                await db.execute(delete(Inventory))
                await db.execute(delete(Journal))
                await db.execute(delete(ChatHistory))
                await db.execute(delete(Entity))
                await db.commit()
                return {"outcome": "PLAYER_DEAD", "message": "Player has died. Save data wiped."}
            
            await db.commit()
            return {"outcome": "Survivor", "current_hp": game_state.current_hp, "status_effects": game_state.status_effects}
            
        else:
            entity = None
            
            try:
                entity_id = int(target_id)
                stmt = select(Entity).where(Entity.id == entity_id)
                entity = (await db.execute(stmt)).scalars().first()
            except ValueError:
                pass
                
            if not entity:
                stmt = select(Entity).where(Entity.name == target_id)
                entity = (await db.execute(stmt)).scalars().first()
                
            if not entity:
                return {"error": f"Entity {target_id} not found."}
                
            entity.current_hp = max(0, min(entity.current_hp + hp_change, entity.max_hp))
            
            if entity.current_hp <= 0:
                entity_name = entity.name
                await db.execute(delete(Entity).where(Entity.id == entity.id))
                await db.commit()
                return {"outcome": "ENTITY_DEAD", "message": f"{entity_name} has been defeated and removed."}
            
            await db.commit()
            return {"outcome": "Entity Damaged", "current_hp": entity.current_hp, "name": entity.name}
        
async def manage_inventory(action: str, item_name: str, item_type: str, quantity: int = 1, equipment_slot: Optional[int] = None) -> dict:
    """
    Manage the player's inventory, adding, removing, or equipping items.
    
    Args:
        action: Make sure action is 'add', 'remove', or 'equip'.
        item_name: Name of the item.
        item_type: 'weapon', 'armour', 'accessory', or 'consumable'/'material' etc.
        quantity: Amount of items (min 1, max 60).
        equipment_slot: Slot number strictly between 1 and 20.
                        Equipment (1-2 weapons, 3-6 armor, 7-10 accessory)
                        Non-equipment (11-20).
    """
    # Slots 1-10 are strictly for equipment (is_equipped = True automatically)
    # Weapons: slots 1-2
    # Armour: slots 3-6 (boots, leggings, chestplate, helmet)
    # Accessories: slots 7-10 (rings, amulets, cloaks, belts)
    # Slots 11-20 are strictly for non-equipment items (max quantity 60)
    # Equipment replaces the old item in the slot (old item is destroyed).
    
    actions = ["add", "remove", "equip"]
    if quantity < 1:
        return {"error": "Quantity must be at least 1."}
        
    async with AsyncSessionLocal() as db:
        if action not in actions:
            return {"error": f"Invalid action. Must be one of: {', '.join(actions)}"}
            
        # Enforce typing and slots
        is_equipment = item_type in ["weapon", "armour", "accessory"]
        
        if not equipment_slot and action in ["add", "equip"]:
            # Auto-assign slot if possible, or reject
            return {"error": "Must specify a slot (1-20) to add or equip an item."}
            
        if equipment_slot is not None:
            if equipment_slot < 1 or equipment_slot > 20:
                return {"error": "Slot must be between 1 and 20."}
                
            if is_equipment and equipment_slot > 10:
                return {"error": "Equipment (weapons, armor, accessories) can only be placed in slots 1-10."}
                
            if not is_equipment and equipment_slot <= 10:
                return {"error": "Non-equipment items can only be placed in slots 11-20."}
                
            # Further equipment slot validation
            if item_type == "weapon" and equipment_slot not in [1, 2]:
                return {"error": "Weapons can only be equipped in slot 1 or 2."}
            if item_type == "armour" and equipment_slot not in range(3, 7):
                return {"error": "Armour can only be equipped in slots 3, 4, 5, or 6."}
            if item_type == "accessory" and equipment_slot not in range(7, 11):
                return {"error": "Accessories can only be equipped in slots 7, 8, 9, or 10."}

        slot_str = str(equipment_slot) if equipment_slot else None

        if action in ["add", "equip"]:
            if is_equipment and quantity > 1:
                return {"error": "Equipment items can only have a quantity of 1."}
            if not is_equipment and quantity > 60:
                return {"error": "Non-equipment items cannot have a quantity greater than 60."}

            # Check what's currently in the slot
            stmt = select(Inventory).where(Inventory.equipment_slot == slot_str)
            result = await db.execute(stmt)
            existing_item = result.scalars().first()

            if is_equipment:
                # Replace whatever is in the slot (destroy the old one)
                if existing_item:
                    await db.execute(delete(Inventory).where(Inventory.item_id == existing_item.item_id))
                
                new_item = Inventory(
                    name=item_name,
                    quantity=1,
                    is_equipped=True,
                    equipment_slot=slot_str
                )
                db.add(new_item)
                await db.commit()
                return {"outcome": "EQUIPPED", "message": f"{item_name} equipped to slot {slot_str}."}
            
            else: # Non-equipment
                if existing_item:
                    if existing_item.name == item_name:
                        # Stack
                        new_qty = existing_item.quantity + quantity
                        if new_qty > 60:
                            return {"error": f"Cannot add. Max stack is 60. You already have {existing_item.quantity}."}
                        existing_item.quantity = new_qty
                        await db.commit()
                        return {"outcome": "ADDED", "message": f"Added {quantity} {item_name} to slot {slot_str}. Total: {new_qty}."}
                    else:
                        # Replace
                        await db.execute(delete(Inventory).where(Inventory.item_id == existing_item.item_id))
                        new_item = Inventory(
                            name=item_name,
                            quantity=quantity,
                            is_equipped=False,
                            equipment_slot=slot_str
                        )
                        db.add(new_item)
                        await db.commit()
                        return {"outcome": "REPLACED", "message": f"Replaced item in slot {slot_str} with {quantity} {item_name}."}
                else:
                    new_item = Inventory(
                        name=item_name,
                        quantity=quantity,
                        is_equipped=False,
                        equipment_slot=slot_str
                    )
                    db.add(new_item)
                    await db.commit()
                    return {"outcome": "ADDED", "message": f"Added {quantity} {item_name} to empty slot {slot_str}."}

        elif action == "remove":
            # Remove an item from a specific slot or by name
            if slot_str:
                stmt = select(Inventory).where(Inventory.equipment_slot == slot_str)
            else:
                stmt = select(Inventory).where(Inventory.name == item_name)
                
            result = await db.execute(stmt)
            existing_item = result.scalars().first()
            
            if not existing_item:
                return {"error": "Item not found to remove."}
                
            if existing_item.quantity <= quantity:
                await db.execute(delete(Inventory).where(Inventory.item_id == existing_item.item_id))
                await db.commit()
                return {"outcome": "REMOVED", "message": f"Removed all {existing_item.name}."}
            else:
                existing_item.quantity -= quantity
                await db.commit()
                return {"outcome": "REMOVED", "message": f"Removed {quantity} {existing_item.name}. {existing_item.quantity} remaining."} 
            
            
            
async def update_journal(entry_description: str) -> dict:
    """
    Adds a new active entry to the character's journal (useful for story flags and new quests).
    
    Args:
        entry_description: Details of the new journal entry/quest.
    """
    #This function adds a new entry to the journal. This functions is rather informative and can be used so simply set something exist,
    # it can't be used to update, complete or fail quests, but it can be used to add new quests or story events to the journal. For quest management we have a separate function.
    async with AsyncSessionLocal() as db:
        new_entry = Journal(description=entry_description, status="active")
        db.add(new_entry)
        await db.commit()
        return {"outcome": "ENTRY_ADDED", "message": f"Journal entry added: {entry_description[:50]}..."}
    
async def quest_management(journal_entry_id: int, new_status: str, new_description: Optional[str] = None) -> dict:
    """
    Update the status of a specific journal quest or event.
    
    Args:
        journal_entry_id: Integer ID of the entry to modify.
        new_status: 'completed', 'failed', or 'active'.
        new_description: Optionally update the text to reflect current state.
    """
    #This function allows updating the status of a journal entry, which can represent quests or story events. 
    #Generally we want here to be either completed or failed as the new status, but we can also allow active for reactivating quests or events.
    async with AsyncSessionLocal() as db:
        if new_status not in ["active", "completed", "failed"]:
            return {"error": "Invalid status. Must be 'active', 'completed', or 'failed'."}
        stmt = select(Journal).where(Journal.entry_id == journal_entry_id)
        result = await db.execute(stmt)
        entry = result.scalars().first()
        if not entry:
            return {"error": f"Journal entry with ID {journal_entry_id} not found."}
        entry.status = new_status
        if new_description is not None:
            entry.description = new_description
        await db.commit()
        if not new_description:
            return {"outcome": "STATUS_UPDATED", "message": f"Journal entry {journal_entry_id} status updated to {new_status}."}
        return {"outcome": "STATUS_UPDATED", "message": f"Journal entry {journal_entry_id} status updated to {new_status}. New description: {new_description[:50]}..."}

async def modify_stats(stat_name: str, change_amount: int, reason: str) -> dict:
    """
    Permanently modify base stats like 'hp' max, 'strength', etc.
    
    Args:
        stat_name: 'hp', 'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'
        change_amount: Amount to increase or decrease the stat by.
        reason: Short rationale for stat change.
    """
    # This function modifies a specific stat or HP based on a given reason.
    async with AsyncSessionLocal() as db:
        stat_name_lower = stat_name.lower()
        
        if stat_name_lower == "hp":
            stmt = select(GameState)
            result = await db.execute(stmt)
            game_state = result.scalars().first()
            if not game_state:
                return {"error": "Game state not found"}
            
            if change_amount > 0:
                game_state.max_hp += change_amount
                game_state.current_hp += change_amount
            else:
                # Lower the max HP
                game_state.max_hp += change_amount
                # Ensure current_hp doesn't exceed the newly lowered max_hp
                if game_state.current_hp > game_state.max_hp:
                    game_state.current_hp = game_state.max_hp
                    
            await db.commit()
            return {
                "outcome": "STAT_MODIFIED", 
                "message": f"HP bounds modified by {change_amount} due to: {reason}. New Max HP: {game_state.max_hp}"
            }
            
        else:
            stmt = select(Stats)
            result = await db.execute(stmt)
            stats = result.scalars().first()
            if not stats:
                return {"error": "Stats not found"}
            
            if not hasattr(stats, stat_name_lower):
                return {"error": f"Stat '{stat_name}' not found."}
            
            current_val = getattr(stats, stat_name_lower)
            new_val = current_val + change_amount
            setattr(stats, stat_name_lower, new_val)
            
            await db.commit()
            return {
                "outcome": "STAT_MODIFIED", 
                "message": f"Stat '{stat_name}' modified by {change_amount} due to: {reason}. New value: {new_val}"
            }
async def change_location(new_location: str, reason: str) -> dict:
    """
    Move the main character to a new location in the world and clear out local entities from the prior scene.
    
    Args:
        new_location: Name of the new location.
        reason: Why the change is occurring.
    """
    async with AsyncSessionLocal() as db:
        stmt = select(GameState)
        result = await db.execute(stmt)
        game_state = result.scalars().first()
        if not game_state:
            return {"error": "Game state not found"}
        
        game_state.current_location = new_location
        # Wipe ephemeral entities from the old location
        await db.execute(delete(Entity))
        
        await db.commit()
        return {
            "outcome": "LOCATION_CHANGED", 
            "message": f"Location changed to '{new_location}' due to: {reason}. All previous entities wiped."
        }

async def add_entity(name: str, hp: int, damage: int, disposition: str = "hostile") -> dict:
    """
    Spawns an NPC, monster, or interactable entity in the current scene.
    
    Args:
        name: Name of the entity.
        hp: Starting health points.
        damage: Base damage.
        disposition: 'hostile', 'friendly', or 'neutral'. Default is hostile.
    """
    # This function adds a new entity to the database when it appears in the world.
    async with AsyncSessionLocal() as db:
        new_entity = Entity(
            name=name,
            current_hp=hp,
            max_hp=hp,
            base_damage=damage,
            disposition=disposition
        )
        db.add(new_entity)
        await db.commit()
        return {
            "outcome": "ENTITY_ADDED",
            "message": f"Entity '{name}' appeared with {hp} HP and {damage} damage."
        }

