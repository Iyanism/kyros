from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger import logger
from src.core.security import create_access_token, create_refresh_token, verify_password
from src.domains.auths.schema import (
    LoginRequest,
    LoginResponse,
    RegistrationRequest,
    RegistrationResponse,
)
from src.domains.clients.service import ClientService, ClientAlreadyExistsError
from src.domains.users.model import UserRole
from src.domains.users.schema import UserCreate, UserResponse
from src.domains.users.service import UserService, UserAlreadyExistsError


class AuthenticationError(Exception):
    pass


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_service = UserService(db)
        self.client_service = ClientService(db)

    async def authenticate(self, login_data: LoginRequest) -> UserResponse:
        user = await self.user_service.get_by_email(login_data.email)
        if not verify_password(login_data.password, user.password_hash):
            logger.warning(
                "Login failed for email=%s, invalid credentials", login_data.email
            )
            raise AuthenticationError("Invalid email or password")

        if not user.is_active:
            logger.warning(
                "Account with email=%s is disabled or blocked", login_data.email
            )
            raise AuthenticationError("User account is blocked or deactivated")
        return UserResponse.model_validate(user)

    def create_tokens(self, user: UserResponse) -> tuple[str, str]:
        token_data: dict[str, object] = {
            "sub": str(user.id),
            "role": str(user.role),
        }
        if user.client_id:
            token_data["client_id"] = str(user.client_id)

        access_token = create_access_token(data=token_data)
        refresh_token = create_refresh_token(data=token_data)
        return access_token, refresh_token

    async def login(self, login_data: LoginRequest) -> LoginResponse:
        user = await self.authenticate(login_data)
        try:
            await self.user_service.update_last_login(user.id)
        except Exception:
            logger.warning(
                "Failed to update last_login for user %s", user.id, exc_info=True
            )
        access_token, refresh_token = self.create_tokens(user)
        logger.info("Login success: email=%s user_id=%s", login_data.email, user.id)
        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            user_id=user.id,
            client_id=user.client_id,
            email=user.email,
            role=user.role,
        )

    async def register(self, register_data: RegistrationRequest) -> RegistrationResponse:
        client = await self.client_service.create(register_data.client)
        try:
            user_data = UserCreate(
                **register_data.user.model_dump(),
                client_id=client.id,
                role=UserRole.CLIENT,
            )
            user = await self.user_service.create(user_data)
        except (ClientAlreadyExistsError, UserAlreadyExistsError):
            raise
        except Exception:
            await self.db.rollback()
            raise

        logger.info(
            "Registration success: user_id=%s email=%s", user.id, user_data.email
        )
        login = await self.login(
            login_data=LoginRequest(
                email=user_data.email,
                password=register_data.user.password,
            )
        )
        return RegistrationResponse(login_info=login, user=user, client=client)
