from __future__ import annotations

import uuid
from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import (
    UUID,
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base
from src.domains.warehouse.model import ChamberCategory

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from src.domains.warehouse.model import Slot  # noqa: TC001


class PalletStatus(StrEnum):
    ALLOCATED = "allocated"
    STORED = "stored"


class Pallet(Base):
    __tablename__: str = "pallets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        index=True,
        default=uuid.uuid4,
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("inbound_orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    pallet_code: Mapped[str] = mapped_column(
        String(32),
        unique=True,
        nullable=False,
        index=True,
    )
    temperature_category: Mapped[ChamberCategory] = mapped_column(
        Enum(ChamberCategory),
        nullable=False,
    )
    weight: Mapped[float] = mapped_column(
        Float,
        nullable=False,
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
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    allocations: Mapped[list["SlotAllocation"]] = relationship(
        "SlotAllocation",
        back_populates="pallet",
        cascade="all, delete-orphan",
    )


class SlotAllocation(Base):
    __tablename__: str = "slot_allocations"
    __table_args__ = (UniqueConstraint("slot_id", name="unique_allocated_slot"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        index=True,
        default=uuid.uuid4,
    )
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
    allocated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    pallet: Mapped["Pallet"] = relationship("Pallet", back_populates="allocations")
    slot: Mapped["Slot"] = relationship("Slot")
