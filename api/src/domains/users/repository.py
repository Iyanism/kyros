from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from domains.users.schema import UserCreate, UserResponse
from src.domains.users.model import User


class UserRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db: AsyncSession = db

    async def get_by_id(self, user_id: UUID) -> User | None:
        stmt = select(User).where(User.id == user_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(self, user_email: str) -> User | None:
        stmt = select(User).where(User.email == user_email)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, user_data: UserCreate) -> UserResponse:
        self.db.add(user_data.model_dump())
        await self.db.commit()
        await self.db.refresh(user_data)
        return UserResponse.model_validate(user_data)
