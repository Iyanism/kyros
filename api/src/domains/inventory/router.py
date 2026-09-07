from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import get_current_user, require_role
from src.core.logger import logger
from src.domains.users.model import User, UserRole
from src.domains.inventory.schema import (
    AllocateRequest,
    ClientInventorySummary,
    PalletItemResponse,
    PalletisationResult,
    PalletResponse,
    PickListRequest,
    PickListResponse,
    SlotAllocationResponse,
)
from src.domains.inventory.service import (
    InsufficientStockError,
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
    dependencies=[Depends(require_role(UserRole.ADMIN, UserRole.OPERATOR))],
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
    dependencies=[Depends(require_role(UserRole.ADMIN, UserRole.OPERATOR))],
)
async def allocate_order(
    order_id: UUID,
    payload: AllocateRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
):
    service = InventoryService(db)
    try:
        return await service.allocate(order_id, payload.chamber_id, user.id)
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


@router.get(
    "/clients/{client_id}/inventory/summary",
    response_model=list[ClientInventorySummary],
    status_code=status.HTTP_200_OK,
)
async def get_client_inventory_summary(
    client_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]
):
    service = InventoryService(db)
    try:
        return await service.list_client_inventory_summary(client_id)
    except InventoryOrderNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(
            f"Unexpected error listing inventory summary for client {client_id}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.get(
    "/clients/{client_id}/inventory",
    response_model=list[PalletItemResponse],
    status_code=status.HTTP_200_OK,
)
async def get_client_inventory(
    client_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]
):
    service = InventoryService(db)
    try:
        return await service.list_client_inventory(client_id)
    except InventoryOrderNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error listing inventory for client {client_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.get(
    "/inventory",
    response_model=list[PalletItemResponse],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(UserRole.ADMIN, UserRole.OPERATOR))],
)
async def get_all_inventory(db: Annotated[AsyncSession, Depends(get_db)]):
    service = InventoryService(db)
    try:
        return await service.list_all_inventory()
    except Exception as e:
        logger.error(f"Unexpected error listing all inventory: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.post(
    "/pick-list",
    response_model=PickListResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(UserRole.ADMIN, UserRole.OPERATOR))],
)
async def generate_pick_list(
    payload: PickListRequest, db: Annotated[AsyncSession, Depends(get_db)]
):
    service = InventoryService(db)
    try:
        return await service.generate_pick_list(payload)
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
    except InsufficientStockError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "INSUFFICIENT_STOCK", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error generating pick list: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.get(
    "/pick-lists/{pick_list_id}",
    response_model=PickListResponse,
    status_code=status.HTTP_200_OK,
)
async def get_pick_list(
    pick_list_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]
):
    service = InventoryService(db)
    try:
        return await service.get_pick_list(pick_list_id)
    except InventoryOrderNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error fetching pick list {pick_list_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.get(
    "/pick-lists/outbound/{outbound_order_id}",
    response_model=PickListResponse,
    status_code=status.HTTP_200_OK,
)
async def get_pick_list_by_outbound_order(
    outbound_order_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]
):
    service = InventoryService(db)
    try:
        return await service.get_pick_list_by_outbound_order(outbound_order_id)
    except InventoryOrderNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(
            f"Unexpected error fetching pick list for outbound order {outbound_order_id}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e
