from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base

class GameState(Base):
    __tablename__ = "game_state"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    current_hp: Mapped[int] = mapped_column(Integer, default=100)
    max_hp: Mapped[int] = mapped_column(Integer, default=100)
    current_location: Mapped[str] = mapped_column(String, default="Starting Area")
    status_effects: Mapped[str] = mapped_column(String, default="") 

class Stats(Base):
    __tablename__ = "stats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    strength: Mapped[int] = mapped_column(Integer, default=10)
    dexterity: Mapped[int] = mapped_column(Integer, default=10)
    constitution: Mapped[int] = mapped_column(Integer, default=10)
    intelligence: Mapped[int] = mapped_column(Integer, default=10)
    wisdom: Mapped[int] = mapped_column(Integer, default=10)
    charisma: Mapped[int] = mapped_column(Integer, default=10)

class Inventory(Base):
    __tablename__ = "inventory"

    item_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, index=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    is_equipped: Mapped[bool] = mapped_column(Boolean, default=False)
    equipment_slot: Mapped[str] = mapped_column(String, nullable=True)

class Journal(Base):
    __tablename__ = "journal"

    entry_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    description: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="active")

class ChatHistory(Base):
    __tablename__ = "chat_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    role: Mapped[str] = mapped_column(String)
    content: Mapped[str] = mapped_column(String)
    timestamp: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Entity(Base):
    __tablename__ = "entities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, index=True)
    disposition: Mapped[str] = mapped_column(String, default="neutral") # "hostile", "neutral", "friendly"
    current_hp: Mapped[int] = mapped_column(Integer, default=10)
    max_hp: Mapped[int] = mapped_column(Integer, default=10)
    base_damage: Mapped[int] = mapped_column(Integer, default=2) 
    
    # Difficulty modifier for narrative purposes it gives extra difficulty to rolling and combat.
    # Serveres to narrative purposes and to make the game more dynamic. 
    difficulty_modifier: Mapped[int] = mapped_column(Integer, default=0)
    