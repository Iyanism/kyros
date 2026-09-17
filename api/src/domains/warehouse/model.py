from __future__ import annotations

import uuid
from enum import StrEnum
from typing import override

from sqlalchemy import (
    CheckConstraint,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.base import Base, TimestampMixin

__all__ = [
    "Chamber",
    "ChamberCategory",
    "ChamberStatus",
    "Rack",
    "RackStatus",
    "Slot",
    "SlotStatus",
]


class ChamberStatus(StrEnum):
    ACTIVE = "active"
    MAINTENANCE = "maintenance"
    INACTIVE = "inactive"


class ChamberCategory(StrEnum):
    FROZEN = "frozen"
    CHILLED = "chilled"
    AMBIENT = "ambient"


class RackStatus(StrEnum):
    ACTIVE = "active"
    FULL = "full"
    MAINTENANCE = "maintenance"
    INACTIVE = "inactive"


class SlotStatus(StrEnum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    OCCUPIED = "occupied"
    MAINTENANCE = "maintenance"


class Chamber(Base, TimestampMixin):
    __tablename__ = "chambers"
    __table_args__ = (
        CheckConstraint(
            "category IN ('frozen', 'chilled', 'ambient')",
            name="valid_chamber_category",
        ),
        CheckConstraint(
            "status IN ('active', 'maintenance', 'inactive')",
            name="valid_chamber_status",
        ),
    )

    name: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )
    code: Mapped[str] = mapped_column(
        String(8),
        unique=True,
        nullable=False,
        index=True,
    )
    category: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )
    temperature: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=ChamberStatus.ACTIVE.value,
    )

    racks: Mapped[list["Rack"]] = relationship(
        back_populates="chamber", cascade="all, delete-orphan"
    )

    @property
    def is_active(self) -> bool:
        return self.status == ChamberStatus.ACTIVE

    # total_capacity / used_capacity are derived: total_slots * 1 MT

    @override
    def __repr__(self) -> str:
        return (
            f"<Chamber(id={self.id}, name={self.name}, "
            f"code={self.code}, status={self.status})>"
        )


class Rack(Base, TimestampMixin):
    __tablename__ = "racks"
    __table_args__ = (
        UniqueConstraint("chamber_id", "rack_number", name="unique_chamber_rack"),
        CheckConstraint(
            "status IN ('active', 'full', 'maintenance', 'inactive')",
            name="valid_rack_status",
        ),
    )

    chamber_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("chambers.id", ondelete="CASCADE"),
        nullable=False,
    )
    rack_number: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=RackStatus.ACTIVE.value,
    )
    chamber: Mapped[Chamber] = relationship(back_populates="racks")
    slots: Mapped[list["Slot"]] = relationship(
        back_populates="rack", cascade="all, delete-orphan"
    )

    @property
    def full_code(self) -> str:
        code = self.chamber.code if self.chamber else str(self.chamber_id)
        return f"{code}-{self.rack_number}"

    @override
    def __repr__(self) -> str:
        return (
            f"<Rack(id={self.id}, chamber_id={self.chamber_id}, "
            f"rack_number={self.rack_number}, status={self.status})>"
        )


class Slot(Base, TimestampMixin):
    __tablename__ = "slots"
    __table_args__ = (
        UniqueConstraint("rack_id", "bay", "level", "depth", name="unique_rack_slot"),
        CheckConstraint(
            "status IN ('available', 'reserved', 'occupied', 'maintenance')",
            name="valid_slot_status",
        ),
    )

    rack_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("racks.id", ondelete="CASCADE"),
        nullable=False,
    )
    bay: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    level: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    depth: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )
    location_code: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        unique=True,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=SlotStatus.AVAILABLE.value,
    )
    allocated_client_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="SET NULL"),
        nullable=True,
    )
    rack: Mapped[Rack] = relationship(back_populates="slots")

    @override
    def __repr__(self) -> str:
        return (
            f"<Slot(id={self.id}, rack_id={self.rack_id}, "
            f"location_code={self.location_code}, status={self.status})>"
        )
