from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.domains.users.schema import UserCreate, UserResponse
from src.domains.users.service import UserService

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
async def delete_user(user_id: str, db: Annotated[AsyncSession, Depends(get_db)]):
    service = UserService(db)
    try:
        deleted = await service.delete(user_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "USER NOT FOUND",
                    "message": f"User with user_id {user_id} not found",
                },
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INTERNAL_ERROR",
                "message": f"unexpected error occurred: {str(e)}",
            },
        )

    return None
