from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import require_role
from src.core.logger import logger
from src.domains.clients.schema import ClientCreate, ClientResponse, ClientUpdate
from src.domains.clients.service import (
    ClientAlreadyExistsError,
    ClientNotFoundError,
    ClientService,
)
from src.domains.users.model import UserRole

router = APIRouter(
    prefix="/clients",
    tags=["Clients"],
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)


def get_client_service(db: Annotated[AsyncSession, Depends(get_db)]) -> ClientService:
    return ClientService(db)


ServiceDep = Annotated[ClientService, Depends(get_client_service)]


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(payload: ClientCreate, service: ServiceDep):
    try:
        return await service.create(payload)
    except ClientAlreadyExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "CLIENT_ALREADY_EXISTS", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Failed to create client: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred.",
            },
        ) from e


@router.get("", response_model=list[ClientResponse], status_code=status.HTTP_200_OK)
async def get_clients(
    service: ServiceDep,
):
    try:
        return await service.list_all()
    except Exception as e:
        logger.error(f"Failed to list clients: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred.",
            },
        ) from e


@router.get(
    "/{client_id}", response_model=ClientResponse, status_code=status.HTTP_200_OK
)
async def get_client(client_id: UUID, service: ServiceDep):
    try:
        return await service.get_by_id(client_id)
    except ClientNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CLIENT_NOT_FOUND", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Failed to get client {client_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred.",
            },
        ) from e


@router.patch(
    "/{client_id}", response_model=ClientResponse, status_code=status.HTTP_200_OK
)
async def update_client(client_id: UUID, payload: ClientUpdate, service: ServiceDep):
    try:
        return await service.update(client_id, payload)
    except ClientNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CLIENT_NOT_FOUND", "message": str(e)},
        ) from e
    except ClientAlreadyExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "CLIENT_ALREADY_EXISTS", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Failed to update client {client_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred.",
            },
        ) from e


@router.patch(
    "/{client_id}/status", response_model=ClientResponse, status_code=status.HTTP_200_OK
)
async def toggle_client_status(client_id: UUID, service: ServiceDep):
    try:
        return await service.toggle_status(client_id)
    except ClientNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CLIENT_NOT_FOUND", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Failed to toggle client status {client_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred.",
            },
        ) from e


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(client_id: UUID, service: ServiceDep):
    try:
        await service.delete(client_id)
        return None
    except ClientNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CLIENT_NOT_FOUND", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Failed to delete client {client_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred.",
            },
        ) from e
