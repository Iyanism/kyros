from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from src.domains.warehouse.model import ChamberCategory, ChamberStatus, RackStatus


class ChamberCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    code: str = Field(min_length=1, max_length=8)
    category: ChamberCategory
    temperature: float
    num_racks: int = Field(ge=1, le=50)
    slots_per_rack: int = Field(ge=1, le=100)


class ChamberResponse(BaseModel):
    id: UUID
    name: str
    code: str
    category: ChamberCategory
    temperature: float
    status: ChamberStatus
    total_racks: int
    total_slots: int
    total_capacity: float
    used_capacity: float
    created_at: datetime
    updated_at: datetime

    model_config: ConfigDict = ConfigDict(from_attributes=True)  # pyright: ignore[reportIncompatibleVariableOverride]


class RackResponse(BaseModel):
    id: UUID
    chamber_id: UUID
    rack_number: str
    full_code: str
    slot_count: int
    occupied_count: int
    status: RackStatus
    created_at: datetime
    updated_at: datetime

    model_config: ConfigDict = ConfigDict(from_attributes=True)  # pyright: ignore[reportIncompatibleVariableOverride]


class SlotResponse(BaseModel):
    id: UUID
    rack_id: UUID
    slot_number: str
    full_code: str
    occupancy: Literal["empty", "partial", "filled"]
    is_occupied: bool
    allocated_client_id: UUID | None = None
    quantity: float | None = None
    created_at: datetime
    updated_at: datetime

    model_config: ConfigDict = ConfigDict(from_attributes=True)  # pyright: ignore[reportIncompatibleVariableOverride]


class RackDetailResponse(RackResponse):
    slots: list[SlotResponse] = []


class ChamberDetailResponse(ChamberResponse):
    racks: list[RackDetailResponse] = []
