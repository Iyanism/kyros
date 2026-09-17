from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.database import get_db
from src.core.dependencies import get_current_user
from src.core.security import verify_refresh_token
from src.domains.auths.schema import (
    LoginRequest,
    LoginResponse,
    RegistrationRequest,
    RegistrationResponse,
)
from src.domains.auths.service import AuthService
from src.domains.users.model import User
from src.domains.users.schema import UserResponse
from src.domains.users.service import UserNotFoundError

router = APIRouter(prefix="/auth", tags=["Auth"])

ACCESS_TOKEN_MAX_AGE = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
REFRESH_TOKEN_MAX_AGE = settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400


def _set_auth_cookies(response: Response, login: LoginResponse) -> None:
    response.set_cookie(
        key="access_token",
        value=login.access_token,
        max_age=ACCESS_TOKEN_MAX_AGE,
        httponly=True,
        samesite="strict",
        secure=settings.ENVIRONMENT == "production",
    )
    response.set_cookie(
        key="refresh_token",
        value=login.refresh_token,
        max_age=REFRESH_TOKEN_MAX_AGE,
        httponly=True,
        samesite="strict",
        secure=settings.ENVIRONMENT == "production",
        path="/auth/refresh",
    )


def get_auth_service(db: Annotated[AsyncSession, Depends(get_db)]) -> AuthService:
    return AuthService(db)


AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def login_user(
    payload: LoginRequest,
    response: Response,
    service: AuthServiceDep,
):
    try:
        login = await service.login(payload)
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    _set_auth_cookies(response, login)
    return login


@router.post(
    "/register",
    response_model=RegistrationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_user(
    payload: RegistrationRequest,
    response: Response,
    service: AuthServiceDep,
):
    registration = await service.register(payload)
    _set_auth_cookies(response, registration.login_info)
    return registration


@router.post("/refresh", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def refresh_token(
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
    service: AuthServiceDep,
    refresh_token_cookie: Annotated[str | None, Cookie(alias="refresh_token")] = None,
):
    if refresh_token_cookie is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found",
        )

    payload = verify_refresh_token(refresh_token_cookie)
    if payload is None or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    try:
        user_id = UUID(str(payload["sub"]))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        ) from None

    user = await db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    user_response = UserResponse.model_validate(user)
    access_token, new_refresh_token = service.create_tokens(user_response)

    login = LoginResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        user_id=user.id,
        client_id=user.client_id,
        email=user.email,
        role=user.role,
    )
    _set_auth_cookies(response, login)
    return login


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout_user(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token", path="/auth/refresh")


@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def me(
    current_user: Annotated[User, Depends(get_current_user)],
):
    return UserResponse.model_validate(current_user)
