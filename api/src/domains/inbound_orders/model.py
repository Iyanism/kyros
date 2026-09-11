from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import UUID, DateTime, Enum, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.base import Base, TimestampMixin

if TYPE_CHECKING:
    from src.domains.clients.model import Client
    from src.domains.inventory.model import Pallet

from src.domains.warehouse.model import ChamberCategory


class OrderRequestStatus(StrEnum):
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    IN_TRANSIT = "in_transit"
    ARRIVED = "arrived"
    PROCESSING = "processing"
    STORED = "stored"


class InboundOrder(Base, TimestampMixin):
    __tablename__: str = "inbound_orders"

    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
    )
    vehicle_number: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    total_quantity: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    status: Mapped[OrderRequestStatus] = mapped_column(
        Enum(OrderRequestStatus),
        default=OrderRequestStatus.SUBMITTED,
        nullable=False,
    )
    client: Mapped["Client"] = relationship(
        "Client",
        back_populates="inbound_orders",
    )

    order_items: Mapped[list["InboundOrderItem"]] = relationship(
        "InboundOrderItem",
        back_populates="order",
        passive_deletes=True,
    )


class InboundOrderItem(Base):
    __tablename__: str = "inbound_order_items"

    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("inbound_orders.id", ondelete="CASCADE"),
        nullable=False,
    )
    product_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    quantity: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    temperature_category: Mapped[ChamberCategory] = mapped_column(
        Enum(ChamberCategory),
        nullable=False,
    )
    batch_number: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    expiry_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    order: Mapped["InboundOrder"] = relationship(
        "InboundOrder",
        back_populates="order_items",
    )
    pallets: Mapped[list["Pallet"]] = relationship(
        "Pallet",
        back_populates="order_item",
    )
