# 🎲 Hardcore AI RPG: Backend Functions & Mechanics Plan

> **Core Philosophy:** The backend is the *Game Engine* (holding mathematical truth), and the LLM is the *Game Master* (interpreting results and weaving the narrative). All risk is resolved through a unified D20 system.

---

## 🧮 1. The D20 Math Engine (`rpg_functions.py`)

To keep the LLM context lightweight while retaining deep RPG mechanics, we use a classic **D20 System**. 

### Stat Modifiers
Stats range from **1 to 20+**. The backend automatically calculates the modifier using the standard formula formula:
`Modifier = floor((Stat - 10) / 2)`
*   *Example: 10 = +0 | 14 = +2 | 8 = -1*

### Degrees of Success
Instead of binary pass/fail, the backend returns the *Degree of Success* to the AI, allowing for dynamic storytelling (e.g., critical hits, glancing blows).
*   🟢 **Natural 20:** Automatic Critical Success (Triumph).
*   🔴 **Natural 1:** Automatic Critical Failure (Catastrophe).
*   🟡 **Total >= DC:** Success.
*   🟠 **Total < DC:** Failure.

---

## 🛠️ 2. Core Gemini Tools (The AI's API)

These functions are exposed to the Gemini API as callable tools. 

### 🎲 `roll_skill_check(skill, dc, narrative_modifier, modifier_reason)`
The universal resolver for *all* risky actions—combat, persuasion, athletics, etc.
*   **AI Input:** `skill` (e.g., "strength"), `dc` (e.g., 15), `narrative_modifier` (e.g., -2), `modifier_reason` (e.g., "Slipping on mud").
*   **Backend Action:** Calculates `1d20 + Stat_Modifier + narrative_modifier`.
*   **Returns:** Exact mathematical payload (Natural Roll, Total, Degree of Success).

### ❤️ `modify_health_and_status(target_id, hp_change, status_effect)`
Called by the AI *after* a `roll_skill_check` if damage or healing is warranted.
*   **AI Input:** `target_id` ("player" or exact Entity ID), `hp_change` (negative for damage), `status_effect` ("bleeding", "poisoned", or `null`).
*   **Backend Action:** Updates DB. Wipes the save file if player HP hits 0 (Permadeath).

### 🎒 `manage_inventory(action, item_id, quantity, equip_slot)`
Manages the player's pockets and equipment slots.
*   **AI Input:** `action` ("add", "remove", "equip", "unequip").
*   **Backend Action:** Enforces logical constraints (e.g., can't equip two chest pieces).

### 📜 `update_journal(entry_id, status)`
Progresses or fails narrative quests.
*   **AI Input:** `entry_id` (from the injected DB context), `status` ("completed", "failed").
*   **Backend Action:** Updates the journal truth.

---

## 🔄 3. Interaction Flow Example (Combat)

How a single turn resolves in the code:

1.  🗣️ **Player:** *"I swing my rusty broadsword at the Goblin's neck!"*
2.  🧠 **Gemini (Thinking):** *"This is a risky attack. The goblin is fast (DC 14). The player is on high ground (+2)."*
    *   *Action:* Calls `roll_skill_check(skill="strength", dc=14, narrative_modifier=2, modifier_reason="High ground advantage")`.
3.  ⚙️ **Backend:** 
    *   Pulls Player Strength from DB (e.g., 16 `[+3]`). 
    *   Rolls `1d20` 🎲 _(rolls a 10)_. 
    *   Calculates: `10 (roll) + 3 (stat) + 2 (narrative) = 15`. 
    *   Returns to Gemini: `{ "outcome": "Success", "total": 15, "natural_roll": 10 }`.
4.  🧠 **Gemini (Thinking):** *"Success! The broadsword hits. I'll deal standard damage."*
    *   *Action:* Calls `modify_health_and_status(target_id="Goblin_1", hp_change=-6)`.
5.  ⚙️ **Backend:** Updates DB, dropping Goblin HP by 6.
6.  🗣️ **Gemini (To Player):** *"Using the high ground, you bring your rusty broadsword down in a clean arc, slicing into the Goblin for 6 damage! It shrieks in pain but readies its spear..."*

---

## 📋 4. Context Injector Rules
To prevent Hallucinations, the backend **must** inject the current database state at the top of the System Prompt before every user message.

```json
{
  "Player": { "HP": "45/50", "Location": "Swamp Ruins" },
  "Stats": { "STR": 16, "DEX": 12, "CON": 14, "INT": 8, "WIS": 10, "CHA": 9 },
  "Visible_Entities": [
    { "id": "Goblin_1", "name": "Swamp Goblin", "disposition": "hostile" }
  ],
  "Status_Effects": []
}