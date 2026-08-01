
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger import logger
from src.core.security import create_access_token, verify_password
from src.domains.auths.schema import LoginRequest, LoginResponse
from src.domains.users.schema import UserResponse
from src.domains.users.service import UserService


class AuthenticationError(Exception):
    pass

class AuthService:

    def __init__(self, db: AsyncSession):
        self.user_service = UserService(db)

    async def authenticate(self, login_data: LoginRequest) -> UserResponse:
        user = await self.user_service.get_by_email(login_data.email)
        if not user and not verify_password(login_data.password, user.password_hash):
            logger.warn(f"Login failed for email:{login_data.email}, invalid credentials")
            raise AuthenticationError("Invalid email or password")

        if not user.is_active:
            logger.warn(f"Account with email:{login_data.email} is disabled or blocked")
            raise AuthenticationError("User accound is blocked or deactivated`")
        return UserResponse.model_validate(user)

    async def create_tokens(self, user: UserResponse) -> str:
        access_token = create_access_token(data={
            "sub": str(user.id),
            "client_id": str(user.client_id),
            "role": str(user.role),
            "email": user.email,
        })

        return access_token

    async def login(self, login_data: LoginRequest) -> LoginResponse:
        user = await self.authenticate(login_data)
        await self.user_service.update_last_login(user)
        access_token = await self.create_tokens(user)
        logger.info("Login success: email=%s user_id=%s", login_data.email, user.id)
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
        )
