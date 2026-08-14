
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import get_current_user
from src.domains.auths.schema import (
    LoginRequest,
    LoginResponse,
    RegistrationRequest,
    RegistrationResponse,
)
from src.domains.auths.service import AuthenticationError, AuthService
from src.domains.users.model import User
from src.domains.users.schema import UserResponse

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def login_user(payload: LoginRequest, db: Annotated[AsyncSession, Depends(get_db)]):
    service = AuthService(db)
    try:
        login = await service.login(payload)
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "AUTHENTICATION ERROR",
                "message": str(e),
            }
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "INTERNAL ERROR",
                "message": f"unexpected error occurred: {str(e)}",
            }
        )
    return login

@router.post("/register", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
async def register_user(payload: RegistrationRequest, db: Annotated[AsyncSession, Depends(get_db)]):
    service = AuthService(db)
    try:
        registeration = await service.register(payload)
    except ValueError as e:
        raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "code": "VALIDATION_ERROR",
                        "message": str(e),
                        "field": getattr(e, "field", None),
                    },
                ) from e
    except AuthenticationError as e:
        raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "code": "AUTHENTICATION ERROR",
                        "message": str(e),
                    }
                ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "INTERNAL ERROR",
                "message": f"unexpected error occurred: {str(e)}",
            }
        )
    return registeration


@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_current_user(
    current_user: Annotated[User, Depends(get_current_user)],
):
    return UserResponse.model_validate(current_user)
