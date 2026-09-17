from collections.abc import MutableMapping, Sequence
from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.domains.users.model import User


class UserRepository:
    """Data access layer for User entities."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, user_id: UUID) -> User | None:
        stmt = select(User).options(selectinload(User.client)).where(User.id == user_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(self, user_email: str) -> User | None:
        stmt = (
            select(User)
            .options(selectinload(User.client))
            .where(func.lower(User.email) == user_email.lower())
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, user: User) -> User:
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def list_all(self, limit: int = 100, offset: int = 0) -> Sequence[User]:
        stmt = (
            select(User)
            .options(selectinload(User.client))
            .order_by(User.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def update(
        self, user_id: UUID, update_data: MutableMapping[str, UUID | str | int]
    ) -> User | None:
        user = await self.get_by_id(user_id)
        if user is None:
            return None

        # Prevent primary key mutation
        update_data.pop("id", None)

        valid_columns = {col.name for col in User.__table__.columns}
        for field, value in update_data.items():
            if field in valid_columns:
                setattr(user, field, value)

        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def toggle_status(self, user_id: UUID) -> User | None:
        user = await self.get_by_id(user_id)
        if user is None:
            return None

        user.is_active = not user.is_active
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def update_last_login(self, user_id: UUID, login_time: datetime) -> None:
        user = await self.get_by_id(user_id)
        if user is None:
            return

        user.last_login = login_time
        await self.db.flush()

    async def delete(self, user_id: UUID) -> bool:
        user = await self.get_by_id(user_id)
        if user is None:
            return False

        await self.db.delete(user)
        await self.db.flush()
        return True
