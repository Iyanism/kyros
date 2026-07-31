from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.domains.users.schema import UserCreate, UserResponse, UserUpdate
from src.domains.users.service import UserNotFoundError, UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreate, db: Annotated[AsyncSession, Depends(get_db)]
):
    service = UserService(db)
    try:
        user = await service.create(payload)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "VALIDATION_ERROR",
                "message": str(e),
                "field": getattr(e, "field", None),
            },
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": f"unexpected error occurred: {str(e)}",
            },
        )

    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    service = UserService(db)
    try:
        await service.delete(user_id)
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "USER NOT FOUND",
                "message": str(e),
            },
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INTERNAL_ERROR",
                "message": f"unexpected error occurred: {str(e)}",
            },
        )

    return None


@router.get("", response_model=list[UserResponse], status_code=status.HTTP_200_OK)
async def get_users(db: Annotated[AsyncSession, Depends(get_db)]):
    service = UserService(db)
    try:
        users = await service.list()
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "USERS NOT FOUND",
                "message": str(e),
            },
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INTERNAL_ERROR",
                "message": f"unexpected error occurred: {str(e)}",
            },
        )

    return users

@router.patch("/{user_id}", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def update_user(user_id: UUID, payload: UserUpdate, db: Annotated[AsyncSession, Depends(get_db)]):
    service = UserService(db)
    try:
        user = await service.update(user_id, payload)
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "USER NOT FOUND",
                "message": str(e),
            },
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": f"unexpected error occurred: {str(e)}",
            },
        )

    return user

@router.get("/{user_id}", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_user(user_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    service = UserService(db)
    try:
        user = await service.get_by_id(user_id)
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "USER NOT FOUND",
                "message": str(e),
            },
        ) from e
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "unexpected error occured in the server"
            },
        )

    return user
