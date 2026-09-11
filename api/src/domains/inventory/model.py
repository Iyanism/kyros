from __future__ import annotations

import uuid
from datetime import UTC, datetime
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import (
    UUID,
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.base import Base, CreatedAtMixin, TimestampMixin
from src.domains.warehouse.model import ChamberCategory

if TYPE_CHECKING:
    from src.domains.inbound_orders.model import InboundOrderItem  # noqa: TC001
    from src.domains.outbound_orders.model import OutboundOrder  # noqa: TC001
    from src.domains.warehouse.model import Slot  # noqa: TC001


class PalletStatus(StrEnum):
    ALLOCATED = "allocated"
    STORED = "stored"
    DISPATCHED = "dispatched"


class Pallet(Base, TimestampMixin):
    __tablename__: str = "pallets"

    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("inbound_orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    order_item_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("inbound_order_items.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    pallet_code: Mapped[str] = mapped_column(
        String(32),
        unique=True,
        nullable=False,
        index=True,
    )
    product_name: Mapped[str] = mapped_column(
        String(255),
        nullable=True,
        index=True,
    )
    batch_code: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )
    expiry_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    temperature_category: Mapped[ChamberCategory] = mapped_column(
        Enum(ChamberCategory),
        nullable=False,
    )
    weight: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    quantity: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0,
    )
    is_partial: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
    status: Mapped[PalletStatus] = mapped_column(
        Enum(PalletStatus),
        nullable=False,
        default=PalletStatus.ALLOCATED,
    )
    allocations: Mapped[list["SlotAllocation"]] = relationship(
        "SlotAllocation",
        back_populates="pallet",
        cascade="all, delete-orphan",
    )
    order_item: Mapped["InboundOrderItem | None"] = relationship(
        "InboundOrderItem",
        back_populates="pallets",
    )
    pick_records: Mapped[list["PickRecord"]] = relationship(
        "PickRecord",
        back_populates="pallet",
    )


class SlotAllocation(Base):
    __tablename__: str = "slot_allocations"

    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("inbound_orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    pallet_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pallets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    slot_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("slots.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(
        default=True,
        nullable=False,
    )
    allocated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    released_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    pallet: Mapped["Pallet"] = relationship("Pallet", back_populates="allocations")
    slot: Mapped["Slot"] = relationship("Slot")


class PickList(Base, CreatedAtMixin):
    __tablename__: str = "pick_lists"
    outbound_order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("outbound_orders.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    total_lines: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    total_quantity: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    total_weight_mt: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    pick_records: Mapped[list["PickRecord"]] = relationship(
        "PickRecord",
        back_populates="pick_list",
    )
    outbound_order: Mapped["OutboundOrder"] = relationship(
        "OutboundOrder",
        back_populates="pick_list",
    )


class PickRecord(Base):
    __tablename__: str = "pick_records"
    pick_list_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pick_lists.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    pallet_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pallets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    quantity: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    weight: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    picked: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
    picked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    pallet: Mapped["Pallet"] = relationship(
        "Pallet",
        back_populates="pick_records",
    )
    pick_list: Mapped["PickList"] = relationship(
        "PickList",
        back_populates="pick_records",
    )
