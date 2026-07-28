from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from domains.users.schema import UserCreate, UserResponse, UserUpdate
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
        user = User(**user_data.model_dump())
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user_data)
        return UserResponse.model_validate(user_data)

    async def list_all(self) -> list[UserResponse]:
        stmt = select(User).order_by(User.created_at.desc())
        result = await self.db.execute(stmt)
        users = result.scalars().all()

        return [UserResponse.model_validate(users)]

    async def delete(self, user_id: UUID) -> None:
        user = self.get_by_id(user_id)
        await self.db.delete(user)
        await self.db.commit()
        return

    async def update(self, user_id: UUID, data: UserUpdate) -> UserResponse:
        user = self.get_by_id(user_id)
        update_data = data.model_dump()

        for field, value in update_data:
            setattr(user, field, value)

        await self.db.commit()
        await self.db.refresh(user)

        return UserResponse.model_validate(user)

    async def update_last_login(self, user: UserResponse) -> UserResponse:
        user.last_login = datetime.now(UTC)
        await self.db.commit()
        await self.db.refresh(user)

        return UserResponse.model_validate(user)
