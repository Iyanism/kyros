from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.base import Base, TimestampMixin

if TYPE_CHECKING:
    from src.domains.clients.model import Client


class UserRole(StrEnum):
    ADMIN = "admin"
    OPERATOR = "operator"
    CLIENT = "client"


class User(Base, TimestampMixin):
    __tablename__: str = "users"

    __table_args__ = (
        # Optional DB-level safeguard ensuring client users link to a client entity
        CheckConstraint(
            "(role = 'client' AND client_id IS NOT NULL) OR (role != 'client')",
            name="chk_user_client_role_has_client_id",
        ),
    )
    client_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )
    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    phone_number: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, native_enum=False, length=20),
        nullable=False,
        default=UserRole.CLIENT,
        server_default=text("'client'"),  # Properly quoted for SQL string default
    )
    is_active: Mapped[bool] = mapped_column(
        default=True,
        server_default=text("true"),
        nullable=False,
    )
    last_login: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    client: Mapped[Client | None] = relationship(
        "Client",
        back_populates="users",
    )

    @property
    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN

    @property
    def is_client(self) -> bool:
        return self.role == UserRole.CLIENT

    @property
    def is_operator(self) -> bool:
        return self.role == UserRole.OPERATOR

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
