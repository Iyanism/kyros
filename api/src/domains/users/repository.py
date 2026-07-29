from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.users.model import User


class UserRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db: AsyncSession = db

    async def get_by_id(self, user_id: UUID) -> User | None:
        user = await self.db.get(User, user_id)
        return user

    async def get_by_email(self, user_email: str) -> User | None:
        stmt = select(User).where(User.email == user_email)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, user_data: User) -> User:
        self.db.add(user_data)
        await self.db.commit()
        await self.db.refresh(user_data)
        return user_data

    async def list_all(self) -> list[User]:
        stmt = select(User).order_by(User.created_at.desc())
        result = await self.db.execute(stmt)
        users = result.scalars().all()

        return [*users]

    async def delete(self, user_id: UUID) -> None:
        user = self.get_by_id(user_id)
        await self.db.delete(user)
        await self.db.commit()
        return

    async def update(self, user_id: UUID, data: User) -> User:
        user = await self.get_by_id(user_id)
        if user is None:
            raise Exception("User not found")

        for field, value in data.__dir__():
            setattr(user, field, value)

        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def update_last_login(self, user: User) -> User:
        user.last_login = datetime.now(UTC)
        await self.db.commit()
        await self.db.refresh(user)

        return user
