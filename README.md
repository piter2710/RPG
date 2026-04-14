# Gilded RPG (Obsidian Chronicles: Gilded Edition)

Welcome to **Gilded RPG**, an immersive, AI-driven web role-playing game. 

## What is this app?
At its core, Gilded RPG is a single-session, hardcore (permadeath) text-based adventure, but with a major twist. Instead of just talking to a chatbot, you are playing a true role-playing game. 

The AI (powered by Google Gemini) acts as your **Dungeon Master (DM)**. It describes the world, the monsters, and the consequences of your actions. However, the AI doesn't have absolute power over the rules. 

The **Python Backend** acts as the strict, uncompromising Game Engine. It holds the absolute truth: your health, your stats, your inventory, and your quest journal. 

## How it works (The Magic Behind the Screen)
When you tell the AI what you want to do (e.g., "I swing my sword at the goblin!"), the AI looks at the situation and decides what skill you are using and if there are any narrative modifiers. For example, if you are fighting in knee-deep mud, the AI might give you a -2 modifier to agility. 

The AI then secretly sends these modifiers to the backend engine to perform a **dice roll (like in Dungeons & Dragons or Baldur's Gate 3)**. The backend does the math, updates your HP, checks if you died (triggering a game-over database wipe), or adds newly found loot to your actual inventory slots. Finally, the AI streams the story result back to your screen.

## Project Structure
- **`rpg_project/` (Frontend):** A React application built with TypeScript and Vite. It contains the beautiful, immersive heads-up display (HUD), selection screens, and your chat interface with the DM. It consumes streaming text endpoints to type out the story in real-time.
- **`rpg_backend/` (Backend):** A Python application built with FastAPI and SQLite. It handles the core game logic, dice rolls, inventory math, database interactions, and integrations with generative AI tools.

## Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### 1. Environment Variables
You will need to set up your environment variables, particularly your AI API key.
1. Copy the `.env_example` file and rename it to `.env`.
2. Fill in your `GEMINI_API_KEY` (and modify the `DATABASE_URL` if you aren't using the default SQLite database).

### 2. Backend Setup
Navigate to the backend directory, set up your Python environment, and install the dependencies:
```bash
cd rpg_backend
pip install -r requirements.txt
```

### 3. Frontend Setup
Navigate to the frontend directory and install the Node dependencies:
```bash
cd rpg_project
npm install
```

### 4. Running the Application
To run both the frontend and the backend simultaneously, you can run the dev scripts. 
*(If you have a `dev:all` script configured in your root or frontend, use that. Otherwise, start them in two separate terminal windows).*

**Terminal 1 (Backend):**
```bash
cd rpg_backend
uvicorn app.main:app --reload
```

**Terminal 2 (Frontend):**
```bash
cd rpg_project
npm run dev
```

Open the local URL provided by Vite (usually `http://localhost:5173`) in your browser to start your adventure!
