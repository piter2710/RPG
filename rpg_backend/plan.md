## Plan: Hardcore AI RPG with Narrative Modifiers



A single-session, hardcore (permadeath) API backend using FastAPI, PostgreSQL, and Gemini tool chaining. The database acts as the strict game engine, holding absolute truth, while the AI acts as the Game Master (GM), generating narrative context and applying thematic numerical modifiers to strict backend dice rolls (BG3-style).



**Database Structure (Single-Session State)**

No users; the entire DB represents the *current* hardcore run. Wiped on death/reset.

- `GameState`: current_hp, max_hp, current_location (singleton row)

- `Stats`: str, dex, con, int, wis, cha (singleton row)

- `Inventory`: item_id, name, quantity, is_equipped, equipment_slot

- `Journal`: entry_id, description, status (active/completed/failed)

- `ChatHistory`: role, content, timestamp (for feeding Gemini context)



**Core API Functions (Gemini Tools)**



1. `roll_skill_check(skill: str, difficulty_class: int, narrative_modifier: int, modifier_reason: str)`

   - *AI Input:* e.g., `("dexterity", 15, -2, "Knee-deep swamp mud slows movement")`.

   - *Backend Action:* Rolls `1d20 + DB[skill] + narrative_modifier`. Returns strict true/false, natural roll, and total.

2. `modify_health_and_status(target: str, hp_change: int, status_effect: str = None)`

   - *AI Input:* e.g., `("player", -5, "bleeding")`. Target can be "player" or an NPC ID.

   - *Backend Action:* Updates DB. If Player HP <= 0, triggers permadeath state wipe and returns `"PLAYER_DEAD"`.

3. `manage_inventory(action: str, item_id: str, quantity: int, equip_slot: str = None)`

   - *AI Input:* Allows 'add', 'drop', 'equip', 'unequip'.

   - *Backend Action:* Enforces slots (e.g., cannot equip two helmets). Returns inventory state change to AI.

4. `update_journal(title: str, entry: str, status: str)`

   - *AI Input:* e.g., `("The Goblin King", "Slay the king in the swamp", "active")`.

   - *Backend Action:* Updates quests. If a main quest hits 'completed', triggers win state.

5. `change_location(new_location: str)`

   - *AI Input:* The ID of the generic new area (e.g., "Swamp Heart").

   - *Backend Action:* Updates GameState, wiping location-specific ephemeral NPCs if needed.

6. `trigger_endgame(is_victory: bool, narrative_reason: str)`

   - *AI Input:* Called when the player wins or does something apocalyptic.

   - *Backend Action:* Wipes DB. Returns final post-game flag to frontend.



**Steps**

1. **Initialize DB Engine:** Scaffold PostgreSQL models (SQLAlchemy) for the single-session tables (`GameState`, `Stats`, `Inventory`, `Journal`, `ChatHistory`).

2. **Implement FastAPI Endpoints:** Create the main `/chat` endpoint and a `/reset` endpoint (for hardcore restarts).

3. **Define Tool Schemas:** Write the Pydantic schemas corresponding to the 6 core API functions above for Gemini tool calling.

4. **Build Context Injector:** Create a middleware function that runs before Gemini is called, pulling the entire DB state into a static JSON block at the top of the System Prompt.

5. **Implement Tool Execution Loop:** When Gemini returns a tool request (e.g., `roll_skill_check`), execute the mapped underlying Python function, update the DB, and loop the response back to Gemini for final narrative generation.

6. **System Prompt (The Rulebook):** Draft the strict instructions forcing the GM to *always* evaluate player inputs that carry risk via `roll_skill_check`, utilizing `narrative_modifier` for environmental storytelling.



**Relevant files**

- `backend/main.py` — Core FastAPI app setup and endpoints

- `backend/database/models.py` — SQLAlchemy ORM models for hardcore state

- `backend/game_logic/tools.py` — The Python implementations of the 6 core tools

- `backend/ai/gemini_client.py` — The recursive tool-calling loop and system prompt logic



**Verification**

1. Send a request swinging a sword in a swamp. Verify Gemini calls `roll_skill_check` with a negative `narrative_modifier` and the backend correctly appends the DB stat minus the modifier.

2. Drop HP to 0 via `modify_health_and_status` and verify the DB is wiped, returning a "game over" payload.



**Decisions**

- Single-session, hardcore focus negates the need for user auth or multi-save databases.

- Simplifying equipment into a single `manage_inventory` tool reduces LLM context overload compared to separate weapon/armor/artifact tools.

- Giving the AI the power of `narrative_modifier` effectively solves the problem of "how does the DB know we are in a swamp?", putting narrative weight on the LLM while keeping mathematical truth in the backend.

