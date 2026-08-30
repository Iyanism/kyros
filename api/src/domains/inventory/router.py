from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import get_current_user
from src.core.logger import logger
from src.domains.inventory.schema import (
    AllocateRequest,
    PalletisationResult,
    PalletResponse,
    SlotAllocationResponse,
)
from src.domains.inventory.service import (
    InventoryConflictError,
    InventoryOrderNotFoundError,
    InventoryService,
    InventoryValidationError,
)

router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"],
    dependencies=[Depends(get_current_user)],
)


@router.post(
    "/orders/{order_id}/pallets",
    response_model=PalletisationResult,
    status_code=status.HTTP_201_CREATED,
)
async def palletise_order(order_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    service = InventoryService(db)
    try:
        return await service.palletise(order_id)
    except InventoryOrderNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        ) from e
    except InventoryConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "CONFLICT", "message": str(e)},
        ) from e
    except InventoryValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VALIDATION_ERROR", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error palletising order {order_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.get(
    "/orders/{order_id}/pallets",
    response_model=list[PalletResponse],
    status_code=status.HTTP_200_OK,
)
async def list_order_pallets(
    order_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]
):
    service = InventoryService(db)
    try:
        return await service.list_pallets(order_id)
    except InventoryOrderNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error listing pallets for order {order_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.post(
    "/orders/{order_id}/allocate",
    response_model=list[SlotAllocationResponse],
    status_code=status.HTTP_201_CREATED,
)
async def allocate_order(
    order_id: UUID,
    payload: AllocateRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = InventoryService(db)
    try:
        return await service.allocate(order_id, payload.chamber_id)
    except InventoryOrderNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        ) from e
    except InventoryConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "CONFLICT", "message": str(e)},
        ) from e
    except InventoryValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VALIDATION_ERROR", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error allocating order {order_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.get(
    "/orders/{order_id}/allocations",
    response_model=list[SlotAllocationResponse],
    status_code=status.HTTP_200_OK,
)
async def list_order_allocations(
    order_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]
):
    service = InventoryService(db)
    try:
        return await service.list_allocations(order_id)
    except InventoryOrderNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error listing allocations for order {order_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e
