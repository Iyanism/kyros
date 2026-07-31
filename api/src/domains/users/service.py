from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger import logger
from src.core.security import hash_password
from src.domains.users.model import User
from src.domains.users.repository import UserRepository
from src.domains.users.schema import UserCreate, UserResponse, UserUpdate


class UserService:
    def __init__(self, db: AsyncSession):
        self.db: AsyncSession = db
        self.repo: UserRepository = UserRepository(db)

    async def create(self, user_data: UserCreate) -> UserResponse:
        existing = await self.repo.get_by_email(user_data.email)
        if existing is not None:
            raise Exception("User with this email already exist.")

        user_data.password_hash = hash_password(user_data.password_hash)

        user: User = User(**user_data.model_dump())
        try:
            user = await self.repo.create(user)
            await self.db.commit()
        except IntegrityError:
            raise Exception("A user with this email already exists")
        except Exception:
            logger.info("DataBase Error during creation of use")
            raise

        logger.info(
            "User created: id=%s email=%s role=%s", user.id, user.email, user.role
        )
        return UserResponse.model_validate(user)

    async def delete(self, user_id: UUID) -> bool:
        try:
            result = await self.repo.delete(user_id)
            if result:
                await self.db.commit()
            return result
        except Exception as e:
            logger.error(f"Error deleting user: {str(e)}")
            raise

    async def list(self) -> list[UserResponse] | None:
        try:
            users = await self.repo.list_all()
            await self.db.commit()
        except Exception as e:
            logger.info(f"Database error during operation: {e}")
            raise
        logger.info("Sending List of Users details")
        return [UserResponse.model_validate(user) for user in users]

    async def update(self, user_id: UUID, update_date: UserUpdate) -> UserResponse:
        try:
            if update_date.password_hash:
                update_date.password_hash = hash_password(update_date.password_hash)

            user = await self.repo.update(user_id, update_date.model_dump())
            if user is None:
                raise Exception(f"No user with user id {user_id} found")
            await self.db.commit()
        except Exception as e:
            logger.error(f"Error updating details of user with user id {user_id} and name {update_date.full_name}: {e}")
            raise

        logger.info(f"Details updated: id:{user_id} email:{user.email} role:{user.role}")
        return UserResponse.model_validate(user)
