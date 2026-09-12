from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import ClientContext, get_client_context
from src.core.logger import logger
from src.domains.stock_movements.schema import StockLevelResponse, StockMovementResponse
from src.domains.stock_movements.service import StockService

router = APIRouter(
    prefix="/stock-movements",
    tags=["Stock Movements"],
    dependencies=[Depends(get_client_context)],
)


@router.get(
    "/levels",
    response_model=list[StockLevelResponse],
    status_code=status.HTTP_200_OK,
)
async def list_stock_levels(
    ctx: Annotated[ClientContext, Depends(get_client_context)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = StockService(db)
    try:
        if ctx.is_staff:
            return await service.list_levels_all()
        return await service.list_levels_by_client(ctx.client_id)
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
    client_id: UUID,
    ctx: Annotated[ClientContext, Depends(get_client_context)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    if not ctx.is_staff and client_id != ctx.client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
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
async def list_stock_movements(
    ctx: Annotated[ClientContext, Depends(get_client_context)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = StockService(db)
    try:
        if ctx.is_staff:
            return await service.list_movements_all()
        return await service.list_movements_by_client(ctx.client_id)
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
    client_id: UUID,
    ctx: Annotated[ClientContext, Depends(get_client_context)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    if not ctx.is_staff and client_id != ctx.client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
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
    order_id: UUID,
    ctx: Annotated[ClientContext, Depends(get_client_context)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = StockService(db)
    try:
        if not ctx.is_staff:
            from src.domains.inbound_orders.service import InboundOrderService

            order_service = InboundOrderService(db)
            order = await order_service.get_by_id(order_id)
            if order.client_id != ctx.client_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Not found",
                )
        return await service.list_movements_by_order(order_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error listing movements for order {order_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e
