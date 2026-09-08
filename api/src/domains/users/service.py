from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger import logger
from src.core.security import hash_password
from src.domains.users.model import User
from src.domains.users.repository import UserRepository
from src.domains.users.schema import (
    UserClientResponse,
    UserCreate,
    UserResponse,
    UserUpdate,
)


class UserNotFoundError(Exception):
    """Raised when a requested user entity does not exist."""


class UserAlreadyExistsError(Exception):
    """Raised when attempting to create/update a user with a duplicate email."""


class UserService:
    def __init__(self, db: AsyncSession) -> None:
        self.db: AsyncSession = db
        self.repo: UserRepository = UserRepository(db)

    async def get_by_id(self, user_id: UUID) -> UserResponse:
        user = await self.repo.get_by_id(user_id)
        if user is None:
            raise UserNotFoundError(f"User with ID '{user_id}' not found.")
        return UserResponse.model_validate(user)

    async def get_by_email(self, user_email: str) -> User:
        user = await self.repo.get_by_email(user_email)
        if user is None:
            raise UserNotFoundError(f"User with email '{user_email}' not found.")
        return user

    async def create(self, user_data: UserCreate) -> UserClientResponse:
        existing = await self.repo.get_by_email(user_data.email)
        if existing is not None:
            raise UserAlreadyExistsError(
                f"User with email '{user_data.email}' already exists."
            )

        # Convert DTO to dict and transform password -> password_hash
        payload = user_data.model_dump()
        raw_password = payload.pop("password")
        payload["password_hash"] = hash_password(raw_password)

        user_entity = User(**payload)

        try:
            user = await self.repo.create(user_entity)
        except IntegrityError as exc:
            await self.db.rollback()
            raise UserAlreadyExistsError(
                f"User with email '{user_data.email}' already exists."
            ) from exc
        except Exception:
            await self.db.rollback()
            logger.exception("Database error occurred during user creation.")
            raise

        logger.info(
            "User created: id=%s email=%s role=%s", user.id, user.email, user.role
        )
        return UserClientResponse.model_validate(user)

    async def list_all(
        self, limit: int = 100, offset: int = 0
    ) -> list[UserClientResponse]:
        users = await self.repo.list_all(limit=limit, offset=offset)
        return [UserClientResponse.model_validate(user) for user in users]

    async def delete(self, user_id: UUID) -> None:
        deleted = await self.repo.delete(user_id)
        if not deleted:
            raise UserNotFoundError(f"No user with user_id {user_id} found")

    async def update(self, user_id: UUID, update_data: UserUpdate) -> UserResponse:
        payload = update_data.model_dump(exclude_unset=True)

        if "password" in payload:
            raw_password = payload.pop("password")
            payload["password_hash"] = hash_password(raw_password)

        try:
            user = await self.repo.update(user_id, payload)
        except IntegrityError as exc:
            await self.db.rollback()
            raise UserAlreadyExistsError(
                "Email is already taken by another account."
            ) from exc

        if user is None:
            raise UserNotFoundError(f"User with ID '{user_id}' not found.")

        logger.info(
            "User updated: id=%s email=%s role=%s", user_id, user.email, user.role
        )
        return UserResponse.model_validate(user)

    async def toggle_status(self, user_id: UUID) -> UserClientResponse:
        user = await self.repo.toggle_status(user_id)
        if user is None:
            raise UserNotFoundError(f"User with ID '{user_id}' not found.")

        logger.info("User status toggled: id=%s is_active=%s", user.id, user.is_active)
        return UserClientResponse.model_validate(user)

    async def update_last_login(self, user_id: UUID) -> None:
        try:
            await self.repo.update_last_login(user_id, login_time=datetime.now(UTC))
        except Exception:
            logger.exception(
                "Failed to update last_login timestamp for user %s", user_id
            )
