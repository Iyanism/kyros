from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from src.domains.orders.model import OrderRequestStatus, UnitCategory
from src.domains.warehouse.model import ChamberCategory


class OrderItemCreate(BaseModel):
    product_name: str
    quantity: int
    unit: UnitCategory
    temperature_category: ChamberCategory
    batch_number: str | None = None
    expiry_date: datetime | None = None


class OrderItemResponse(BaseModel):
    id: UUID
    order_id: UUID
    product_name: str
    quantity: int
    unit: UnitCategory
    temperature_category: ChamberCategory
    batch_number: str | None = None
    expiry_date: datetime | None = None

    model_config: ConfigDict = ConfigDict(from_attributes=True)  # pyright: ignore[reportIncompatibleVariableOverride]  # ty: ignore[invalid-attribute-override]


class InboundOrderCreate(BaseModel):
    client_id: UUID
    vehicle_number: str
    total_quantity: int
    items: list[OrderItemCreate]


class InboundOrderUpdate(BaseModel):
    vehicle_number: str | None = None
    total_quantity: int | None = None
    status: OrderRequestStatus | None = None


class InboundOrderStatusUpdate(BaseModel):
    status: OrderRequestStatus


class InboundOrderResponse(BaseModel):
    id: UUID
    client_id: UUID
    vehicle_number: str
    total_quantity: int
    status: OrderRequestStatus
    items: list[OrderItemResponse]
    created_at: datetime
    updated_at: datetime

    model_config: ConfigDict = ConfigDict(from_attributes=True)  # pyright: ignore[reportIncompatibleVariableOverride]  # ty: ignore[invalid-attribute-override]
