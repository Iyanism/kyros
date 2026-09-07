from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import require_role
from src.domains.users.model import UserRole
from src.domains.users.schema import (
    UserClientResponse,
    UserCreate,
    UserResponse,
    UserUpdate,
)
from src.domains.users.service import UserService

router = APIRouter(
    prefix="/users",
    tags=["Users"],
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)


# Dependency Injection Helper
def get_user_service(db: Annotated[AsyncSession, Depends(get_db)]) -> UserService:
    return UserService(db)


UserServiceDep = Annotated[UserService, Depends(get_user_service)]


@router.post("", response_model=UserClientResponse, status_code=status.HTTP_201_CREATED)
async def create_user(payload: UserCreate, service: UserServiceDep):
    return await service.create(payload)


@router.get("", response_model=list[UserClientResponse], status_code=status.HTTP_200_OK)
async def get_users(
    service: UserServiceDep,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    return await service.list_all(limit=limit, offset=offset)


@router.get("/{user_id}", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_user(user_id: UUID, service: UserServiceDep):
    return await service.get_by_id(user_id)


@router.patch("/{user_id}", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def update_user(user_id: UUID, payload: UserUpdate, service: UserServiceDep):
    return await service.update(user_id, payload)


@router.patch(
    "/{user_id}/status",
    response_model=UserClientResponse,
    status_code=status.HTTP_200_OK,
)
async def toggle_user_status(user_id: UUID, service: UserServiceDep):
    return await service.toggle_status(user_id)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: UUID, service: UserServiceDep):
    await service.delete(user_id)
    return None
