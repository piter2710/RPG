from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select
from app.settings import settings
from app.database import engine, Base, get_db
from app.AI_setup import generate_fairy_tale_stream, generate_campaign_stream, start_campaign_stream, generate_random_locations
from app.models import GameState, Stats, Inventory, Journal, Entity, ChatHistory
from fastapi.middleware.cors import CORSMiddleware

class CampaignRequest(BaseModel):
    player_input: str

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()

app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.app_name}!"}

@app.get("/fairy-tale")
async def get_fairy_tale():
    return StreamingResponse(
        generate_fairy_tale_stream(),
        media_type="text/plain"
    )

@app.get("/locations")
async def get_starting_locations():
    locations = await generate_random_locations()
    return {"locations": locations}

@app.post("/campaign/start")
async def start_campaign(game_place: str = "The Cursed Outskirts"):
    return StreamingResponse(
        start_campaign_stream(game_place=game_place),
        media_type="text/plain"
    )

@app.post("/campaign")
async def campaign_chat(request: CampaignRequest):
    return StreamingResponse(
        generate_campaign_stream(request.player_input),
        media_type="text/plain"
    )


@app.get("/chat-history")
async def get_chat_history(db: AsyncSession = Depends(get_db)):
    chat_res = await db.execute(select(ChatHistory).order_by(ChatHistory.id))
    chat = chat_res.scalars().all()
    return [{"role": c.role, "content": c.content, "timestamp": c.timestamp} for c in chat]

@app.get("/state/")
async def get_game_state(db: AsyncSession = Depends(get_db)):
    gs_res = await db.execute(select(GameState))
    stats_res = await db.execute(select(Stats))
    inv_res = await db.execute(select(Inventory))
    journ_res = await db.execute(select(Journal))
    ent_res = await db.execute(select(Entity))
    
    gs = gs_res.scalars().first()
    st = stats_res.scalars().first()
    
    def model_to_dict(model):
        if not model:
            return None
        return {c.name: getattr(model, c.name) for c in model.__table__.columns}

    return {
        "game_state": model_to_dict(gs),
        "stats": model_to_dict(st),
        "inventory": [model_to_dict(i) for i in inv_res.scalars().all()],
        "journal": [model_to_dict(j) for j in journ_res.scalars().all()],
        "entities": [model_to_dict(e) for e in ent_res.scalars().all()]
    }
    