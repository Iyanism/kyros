from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from src.domains.inventory.model import PalletStatus
from src.domains.warehouse.model import ChamberCategory


class PalletResponse(BaseModel):
    id: UUID
    order_id: UUID
    order_item_id: UUID | None
    client_id: UUID
    pallet_code: str
    product_name: str | None
    batch_code: str
    expiry_date: datetime
    temperature_category: ChamberCategory
    weight: float
    quantity: float
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


class ClientInventorySummary(BaseModel):
    product_name: str
    batch_code: str
    expiry_date: datetime
    temperature_category: ChamberCategory
    total_quantity: float
    total_weight_mt: float
    pallet_count: int


class PalletItemResponse(BaseModel):
    id: UUID
    pallet_code: str
    product_name: str
    batch_code: str
    expiry_date: datetime
    temperature_category: ChamberCategory
    quantity: float
    weight: float
    is_partial: bool
    status: PalletStatus
    slot_code: str
    chamber_code: str
    chamber_name: str
    rack_number: str
    location_code: str
    created_at: datetime
    updated_at: datetime


class PickListRequest(BaseModel):
    outbound_order_id: UUID


class PickRecordResponse(BaseModel):
    id: UUID
    pallet_id: UUID
    pallet_code: str
    product_name: str
    batch_code: str
    quantity: float
    weight: float
    slot_code: str
    picked: bool
    picked_at: datetime | None = None

    model_config: ConfigDict = ConfigDict(from_attributes=True)  # pyright: ignore[reportIncompatibleVariableOverride]


class PickListResponse(BaseModel):
    id: UUID
    outbound_order_id: UUID
    total_lines: int
    total_quantity: float
    total_weight_mt: float
    records: list[PickRecordResponse]
    created_at: datetime

    model_config: ConfigDict = ConfigDict(from_attributes=True)  # pyright: ignore[reportIncompatibleVariableOverride]
