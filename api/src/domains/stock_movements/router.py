from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import get_current_user
from src.core.logger import logger
from src.domains.stock_movements.schema import StockLevelResponse, StockMovementResponse
from src.domains.stock_movements.service import StockService

router = APIRouter(
    prefix="/stock-movements",
    tags=["Stock Movements"],
    dependencies=[Depends(get_current_user)],
)


@router.get(
    "/levels",
    response_model=list[StockLevelResponse],
    status_code=status.HTTP_200_OK,
)
async def list_stock_levels(db: Annotated[AsyncSession, Depends(get_db)]):
    service = StockService(db)
    try:
        return await service.list_levels_all()
    except Exception as e:
        logger.error(f"Unexpected error listing stock levels: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.get(
    "/levels/client/{client_id}",
    response_model=list[StockLevelResponse],
    status_code=status.HTTP_200_OK,
)
async def list_stock_levels_by_client(
    client_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]
):
    service = StockService(db)
    try:
        return await service.list_levels_by_client(client_id)
    except Exception as e:
        logger.error(f"Unexpected error listing stock levels for client {client_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.get(
    "/movements",
    response_model=list[StockMovementResponse],
    status_code=status.HTTP_200_OK,
)
async def list_stock_movements(db: Annotated[AsyncSession, Depends(get_db)]):
    service = StockService(db)
    try:
        return await service.list_movements_all()
    except Exception as e:
        logger.error(f"Unexpected error listing stock movements: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.get(
    "/movements/client/{client_id}",
    response_model=list[StockMovementResponse],
    status_code=status.HTTP_200_OK,
)
async def list_stock_movements_by_client(
    client_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]
):
    service = StockService(db)
    try:
        return await service.list_movements_by_client(client_id)
    except Exception as e:
        logger.error(f"Unexpected error listing movements for client {client_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.get(
    "/movements/order/{order_id}",
    response_model=list[StockMovementResponse],
    status_code=status.HTTP_200_OK,
)
async def list_stock_movements_by_order(
    order_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]
):
    service = StockService(db)
    try:
        return await service.list_movements_by_order(order_id)
    except Exception as e:
        logger.error(f"Unexpected error listing movements for order {order_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e
