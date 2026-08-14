
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger import logger
from src.core.security import create_access_token, verify_password
from src.domains.auths.schema import (
    LoginRequest,
    LoginResponse,
    RegistrationRequest,
    RegistrationResponse,
)
from src.domains.clients.service import ClientService
from src.domains.users.model import UserRole
from src.domains.users.schema import UserCreate, UserResponse
from src.domains.users.service import UserService


class AuthenticationError(Exception):
    pass


class AuthService:

    def __init__(self, db: AsyncSession):
        self.user_service = UserService(db)
        self.client_service = ClientService(db)

    async def authenticate(self, login_data: LoginRequest) -> UserResponse:
        user = await self.user_service.get_by_email(login_data.email)
        if not verify_password(login_data.password, user.password_hash):
            logger.warning(f"Login failed for email:{login_data.email}, invalid credentials")
            raise AuthenticationError("Invalid email or password")

        if not user.is_active:
            logger.warning(f"Account with email:{login_data.email} is disabled or blocked")
            raise AuthenticationError("User account is blocked or deactivated")
        return UserResponse.model_validate(user)

    async def create_tokens(self, user: UserResponse) -> str:
        access_token = create_access_token(data={
            "sub": str(user.id),
            "client_id": str(user.client_id) if user.client_id else None,
            "role": str(user.role),
        })

        return access_token

    async def login(self, login_data: LoginRequest) -> LoginResponse:
        user = await self.authenticate(login_data)
        await self.user_service.update_last_login(user.id)
        access_token = await self.create_tokens(user)
        logger.info("Login success: email=%s user_id=%s", login_data.email, user.id)
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user_id=user.id,
            client_id=user.client_id,
            email=user.email,
            role=user.role,
        )

    async def register(self, register_data: RegistrationRequest):
        client = await self.client_service.create(register_data.client)
        user_data = UserCreate(**register_data.user.model_dump(), client_id=client.id, role=UserRole.CLIENT)
        user = await self.user_service.create(user_data)
        logger.info("Authentication in progress...")
        login = await self.login(login_data=LoginRequest(
            email=user_data.email,
            password=user_data.password_hash,
        ))
        return RegistrationResponse(
            login_info=login,
            user=user,
            client=client
        )
