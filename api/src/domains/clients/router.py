from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.domains.clients.schema import ClientCreate, ClientResponse, ClientUpdate
from src.domains.clients.service import ClientNotFoundError, ClientService

router = APIRouter(prefix="/clients", tags=["Clients"])


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    payload: ClientCreate, db: Annotated[AsyncSession, Depends(get_db)]
):
    service = ClientService(db)
    try:
        client = await service.create(payload)
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

    return client


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(client_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    service = ClientService(db)
    try:
        await service.delete(client_id)
    except ClientNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "CLIENT NOT FOUND",
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


@router.patch("/{client_id}/deactivate", status_code=status.HTTP_200_OK)
async def deactivate_client(
    client_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]
):
    service = ClientService(db)
    try:
        await service.deactivate(client_id)
    except ClientNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "CLIENT NOT FOUND",
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


@router.get("", response_model=list[ClientResponse], status_code=status.HTTP_200_OK)
async def get_clients(db: Annotated[AsyncSession, Depends(get_db)]):
    service = ClientService(db)
    try:
        clients = await service.list()
    except ClientNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "CLIENTS NOT FOUND",
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

    return clients


@router.get(
    "/{client_id}", response_model=ClientResponse, status_code=status.HTTP_200_OK
)
async def get_client(client_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    service = ClientService(db)
    try:
        client = await service.get_by_id(client_id)
    except ClientNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "CLIENTS NOT FOUND",
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

    return client


@router.patch(
    "/{client_id}", response_model=ClientResponse, status_code=status.HTTP_200_OK
)
async def update(
    client_id: UUID, payload: ClientUpdate, db: Annotated[AsyncSession, Depends(get_db)]
):
    service = ClientService(db)
    try:
        client = await service.update(client_id, payload)
    except ClientNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "CLIENTS NOT FOUND",
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

    return client
