from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from src.domains.inventory.model import PalletStatus
from src.domains.warehouse.model import ChamberCategory


class PalletResponse(BaseModel):
    id: UUID
    order_id: UUID
    pallet_code: str
    temperature_category: ChamberCategory
    weight: float
    is_partial: bool
    status: PalletStatus
    created_at: datetime
    updated_at: datetime

    model_config: ConfigDict = ConfigDict(from_attributes=True)  # pyright: ignore[reportIncompatibleVariableOverride]


class PalletisationResult(BaseModel):
    order_id: UUID
    total_pallets: int
    total_weight_mt: float
    pallets: list[PalletResponse]


class SlotAllocationResponse(BaseModel):
    id: UUID
    order_id: UUID
    pallet_id: UUID
    slot_id: UUID
    pallet_code: str
    temperature_category: ChamberCategory
    slot_code: str
    allocated_at: datetime

    model_config: ConfigDict = ConfigDict(from_attributes=True)  # pyright: ignore[reportIncompatibleVariableOverride]


class AllocateRequest(BaseModel):
    chamber_id: UUID | None = None
