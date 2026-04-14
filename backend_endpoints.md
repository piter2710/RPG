# Backend Endpoints & Data Guidelines

This document provides a descriptive guide for frontend development regarding the available backend endpoints, their expected inputs, and the shape of the data they return. The backend is built with FastAPI.

## Base URL
Assuming local development, the API runs on `http://127.0.0.1:8000`.

---

## 1. Streaming Endpoints (Text/Generative AI)

These endpoints return a **StreamingResponse** of `text/plain`. The frontend should consume them as streams (e.g., using the Fetch API with readable streams or Server-Sent Events if adapted) to display the AI's narrative progressively to the user.



### `POST /campaign/start`
- **Description:** Initializes a new campaign and starts the first narrative sequence.
- **Query Parameters:**
  - `game_place` (string, optional): The starting location. Default is `"The Cursed Outskirts"`.
- **Output:** Stream of plain text (AI response).

### `POST /campaign`
- **Description:** The primary endpoint for chatting or sending player actions to the AI during the campaign.
- **Body (`application/json`):**
  ```json
  {
    "player_input": "I swing my sword at the goblin!"
  }
  ```
- **Output:** Stream of plain text (the Dungeon Master's response/narration).

---

## 2. State & History Endpoints (JSON)

These endpoints return standard JSON data representing the current game state and the chat logs.

### `GET /chat-history`
- **Description:** Retrieves the full conversation history. Useful for populating the chat window upon reloading the app.
- **Output (`application/json`):**
  An array of chat message objects.
  ```json
  [
    {
      "role": "system | user | model",
      "content": "Message content here...",
      "timestamp": "2026-04-12T10:00:00.000Z"
    }
  ]
  ```

### `GET /state/`
- **Description:** Retrieves the complete state of the RPG game, including player stats, inventory, active journal quests, and present entities in the world. 
- **Output (`application/json`):**
  ```json
  {
    "game_state": {
      "id": 1,
      "current_hp": 20,
      "max_hp": 20,
      "current_location": "The Cursed Outskirts",
      "status_effects": "poisoned, bleeding"
    },
    "stats": {
      "id": 1,
      "strength": 12,
      "dexterity": 14,
      "constitution": 10,
      "intelligence": 15,
      "wisdom": 10,
      "charisma": 8
    },
    "inventory": [
      {
        "item_id": 1,
        "name": "Iron Sword",
        "quantity": 1,
        "is_equipped": true,
        "equipment_slot": "right_hand"
      }
    ],
    "journal": [
      {
        "entry_id": 1,
        "description": "Find the missing blacksmith.",
        "status": "active" // active, completed, failed
      }
    ],
    "entities": [
      {
        "id": 1,
        "name": "Goblin Scout",
        "disposition": "hostile", // hostile, neutral, friendly
        "current_hp": 5,
        "max_hp": 10,
        "base_damage": 2,
        "difficulty_modifier": 0
      }
    ]
  }
  ```

---

## Guidance for Frontend Developers

1. **Handling Streams:** For endpoints like `/campaign` and `/campaign/start`, ensure the user interface can handle text chunks arriving asynchronously. You might want to type out the text as it arrives for a "typewriter" effect.
2. **Game State Synchronization:** Since the backend is driven by AI that executes tools behind the scenes, the game state (Stats, HP, Inventory, etc.) can change during a `/campaign` stream interaction. It is recommended to re-fetch the `/state/` and potentially `/chat-history` API after a player action finishes streaming.
3. **CORS:** CORS middleware is already configured on the backend to allow all origins (`*`), so you shouldn't encounter cross-origin issues during local frontend development.
4. **Data Nullability:** Beware that properties like `game_state` or `stats` from `/state/` could potentially return `null` if the campaign hasn't been properly initiated yet. Add safe fallbacks in your React components.
