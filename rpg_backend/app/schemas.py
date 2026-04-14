from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

# --- Game State Schemas ---

class GameStateCreate(BaseModel):
    current_hp: int
    max_hp: int
    current_location: str
    status_effects: str

class GameStateUpdate(BaseModel):
    current_hp: Optional[int] = None
    max_hp: Optional[int] = None
    current_location: Optional[str] = None
    status_effects: Optional[str] = None

class GameStateRead(BaseModel):
    id: int
    current_hp: int
    max_hp: int
    current_location: str
    status_effects: str

    model_config = ConfigDict(from_attributes=True)

# --- Stats Schemas ---

class StatsCreate(BaseModel):
    strength: int = Field(default=10, ge=1)
    dexterity: int = Field(default=10, ge=1)
    constitution: int = Field(default=10, ge=1)
    intelligence: int = Field(default=10, ge=1)
    wisdom: int = Field(default=10, ge=1)
    charisma: int = Field(default=10, ge=1)

class StatsUpdate(BaseModel):
    strength: Optional[int] = Field(None, ge=1)
    dexterity: Optional[int] = Field(None, ge=1)
    constitution: Optional[int] = Field(None, ge=1)
    intelligence: Optional[int] = Field(None, ge=1)
    wisdom: Optional[int] = Field(None, ge=1)
    charisma: Optional[int] = Field(None, ge=1)

class StatsRead(BaseModel):
    id: int
    strength: int
    dexterity: int
    constitution: int
    intelligence: int
    wisdom: int
    charisma: int

    model_config = ConfigDict(from_attributes=True)

# --- Inventory Schemas ---

class InventoryCreate(BaseModel):
    name: str
    quantity: int = Field(default=1, ge=1)
    is_equipped: bool = False
    equipment_slot: Optional[str] = None

class InventoryUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[int] = Field(None, ge=1)
    is_equipped: Optional[bool] = None
    equipment_slot: Optional[str] = None

class InventoryRead(BaseModel):
    item_id: int
    name: str
    quantity: int
    is_equipped: bool
    equipment_slot: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# --- Journal Schemas ---

class JournalCreate(BaseModel):
    description: str
    status: str = Field(default="active", description="active/completed/failed")

class JournalUpdate(BaseModel):
    description: Optional[str] = None
    status: Optional[str] = Field(None, description="active/completed/failed")

class JournalRead(BaseModel):
    entry_id: int
    description: str
    status: str

    model_config = ConfigDict(from_attributes=True)

# --- Entity Schemas ---

class EntityCreate(BaseModel):
    name: str
    disposition: str = Field(default="neutral", description="hostile/neutral/friendly")
    current_hp: int = Field(default=10, ge=0)
    max_hp: int = Field(default=10, ge=1)
    base_damage: int = Field(default=2, ge=0)
    difficulty_modifier: int = Field(default=0)

class EntityUpdate(BaseModel):
    name: Optional[str] = None
    disposition: Optional[str] = Field(None, description="hostile/neutral/friendly")
    current_hp: Optional[int] = Field(None, ge=0)
    max_hp: Optional[int] = Field(None, ge=1)
    base_damage: Optional[int] = Field(None, ge=0)
    difficulty_modifier: Optional[int] = None

class EntityRead(BaseModel):
    id: int
    name: str
    disposition: str
    current_hp: int
    max_hp: int
    base_damage: int
    difficulty_modifier: int

    model_config = ConfigDict(from_attributes=True)

# --- Chat History Schemas ---

class ChatHistoryCreate(BaseModel):
    role: str = Field(..., description="user/model/system")
    content: str

class ChatHistoryRead(BaseModel):
    id: int
    role: str
    content: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Tool Request Schemas (For Gemini Callbacks/API Payloads) ---
# Based on the plan.md API Functions

class RollSkillCheckRequest(BaseModel):
    skill: str
    difficulty_class: int
    narrative_modifier: int
    modifier_reason: str

class ModifyHealthRequest(BaseModel):
    target: str = Field(..., description="Target name or 'player'")
    hp_change: int
    status_effect: Optional[str] = None

class ManageInventoryRequest(BaseModel):
    action: str = Field(..., description="add/drop/equip/unequip")
    item_id: Optional[int] = None
    name: Optional[str] = None
    quantity: int = 1
    equip_slot: Optional[str] = None

class UpdateJournalRequest(BaseModel):
    title: str
    entry: str
    status: str = Field(..., description="active/completed/failed")

class ChangeLocationRequest(BaseModel):
    new_location: str

class TriggerEndgameRequest(BaseModel):
    is_victory: bool
    narrative_reason: str

# --- Location Generation Schemas ---
class LocationIdea(BaseModel):
    id: str
    title: str
    description: str
    buttonLabel: str
    themeColor: str = Field(description="Must be one of: 'primary', 'secondary', 'tertiary'")

class LocationsResponse(BaseModel):
    locations: list[LocationIdea]
