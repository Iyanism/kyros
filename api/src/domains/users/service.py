from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger import logger
from src.core.security import hash_password
from src.domains.users.model import User
from src.domains.users.repository import UserRepository
from src.domains.users.schema import UserCreate, UserResponse, UserUpdate


class UserNotFoundError(Exception):
    pass


class UserService:
    def __init__(self, db: AsyncSession):
        self.db: AsyncSession = db
        self.repo: UserRepository = UserRepository(db)

    async def get_by_id(self, user_id: UUID) -> UserResponse:
        user = await self.repo.get_by_id(user_id)
        if user is None:
            raise UserNotFoundError(f"No user with user_id {user_id} found")

        return UserResponse.model_validate(user)

    async def get_by_email(self, user_email: str) -> UserResponse:
        user = await self.repo.get_by_email(user_email)
        if user is None:
            raise UserNotFoundError(f"No user with user_email {user_email} found")
        return UserResponse.model_validate(user)

    async def create(self, user_data: UserCreate) -> UserResponse:
        existing = await self.repo.get_by_email(user_data.email)
        if existing is not None:
            raise ValueError("User with this email already exist.")

        user_data.password_hash = hash_password(user_data.password_hash)

        user: User = User(**user_data.model_dump())
        try:
            user = await self.repo.create(user)
            await self.db.commit()
        except IntegrityError:
            raise ValueError("A user with this email already exists")
        except Exception:
            logger.info("DataBase Error during creation of use")
            raise

        logger.info(
            "User created: id=%s email=%s role=%s", user.id, user.email, user.role
        )
        return UserResponse.model_validate(user)

    async def delete(self, user_id: UUID) -> None:
        deleted = await self.repo.delete(user_id)
        if not deleted:
            raise UserNotFoundError(f"No user with user_id {user_id} found")
        await self.db.commit()

    async def list(self) -> list[UserResponse]:
        users = await self.repo.list_all()
        await self.db.commit()
        if not users:
            raise UserNotFoundError("No users found")
        logger.info("Sending List of Users details")
        return [UserResponse.model_validate(user) for user in users]

    async def update(self, user_id: UUID, update_date: UserUpdate) -> UserResponse:
        try:
            if update_date.password_hash:
                update_date.password_hash = hash_password(update_date.password_hash)

            user = await self.repo.update(
                user_id, update_date.model_dump(exclude_unset=True)
            )
            if user is None:
                raise UserNotFoundError(f"No user with user id {user_id} found")
            await self.db.commit()
        except Exception as e:
            logger.error(
                f"Error updating details of user with user id {user_id} and name {update_date.full_name}: {e}"
            )
            raise

        logger.info(
            f"Details updated: id:{user_id} email:{user.email} role:{user.role}"
        )
        return UserResponse.model_validate(user)

    async def deactivate(self, user_id: UUID) -> None:
        deactivate = await self.repo.deactivate(user_id)
        if not deactivate:
            raise UserNotFoundError(f"No user with user id {user_id} found")
        await self.db.commit()
