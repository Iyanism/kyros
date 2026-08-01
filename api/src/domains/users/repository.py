from collections.abc import Mapping, Sequence
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.users.model import User


class UserRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db: AsyncSession = db

    async def get_by_id(self, user_id: UUID) -> User | None:
        return await self.db.get(User, user_id)

    async def get_by_email(self, user_email: str) -> User | None:
        stmt = select(User).where(User.email == user_email)
        result = await self.db.execute(stmt)

        return result.scalar_one_or_none()

    async def create(self, user_data: User) -> User:
        self.db.add(user_data)
        await self.db.flush()
        await self.db.refresh(user_data)
        return user_data

    async def list_all(self) -> Sequence[User]:
        stmt = select(User).order_by(User.created_at.desc())
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def delete(self, user_id: UUID) -> bool:
        user = await self.get_by_id(user_id)
        if user is None:
            return False
        await self.db.delete(user)
        await self.db.flush()
        return True

    async def update(
        self, user_id: UUID, update_data: Mapping[str, UUID | str | int]
    ) -> User | None:
        user = await self.get_by_id(user_id)
        if user is None:
            return None
        for field, value in update_data.items():
            setattr(user, field, value)

        await self.db.flush()
        await self.db.refresh(user)

        return user

    async def deactivate(self, user_id: UUID) -> bool:
        user = await self.get_by_id(user_id)
        if user is None:
            return False
        user.is_active = False
        await self.db.flush()
        return True

    async def update_last_login(self, user: User) -> None:
        user.last_login = datetime.now(UTC)
        await self.db.flush()
        await self.db.refresh(user)
