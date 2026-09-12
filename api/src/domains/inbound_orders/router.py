from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import ClientContext, get_client_context, require_role
from src.core.logger import logger
from src.domains.inbound_orders.schema import (
    InboundOrderCreate,
    InboundOrderResponse,
    InboundOrderStatusUpdate,
    InboundOrderUpdate,
)
from src.domains.inbound_orders.service import (
    InboundOrderNotFoundError,
    InboundOrderService,
    InboundOrderStatusError,
    InboundOrderValidationError,
)
from src.domains.inventory.service import InventoryConflictError
from src.domains.users.model import UserRole

router = APIRouter(
    prefix="/inbound-orders",
    tags=["Inbound Orders"],
    dependencies=[Depends(get_client_context)],
)


@router.post(
    "", response_model=InboundOrderResponse, status_code=status.HTTP_201_CREATED
)
async def create_inbound_order(
    payload: InboundOrderCreate,
    ctx: Annotated[ClientContext, Depends(get_client_context)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    if not ctx.is_staff:
        payload.client_id = ctx.client_id
    service = InboundOrderService(db)
    try:
        return await service.create(payload)
    except InboundOrderNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        ) from e
    except InboundOrderValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VALIDATION_ERROR", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error creating inbound order: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.get(
    "", response_model=list[InboundOrderResponse], status_code=status.HTTP_200_OK
)
async def list_inbound_orders(
    ctx: Annotated[ClientContext, Depends(get_client_context)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = InboundOrderService(db)
    try:
        if ctx.is_staff:
            return await service.list_all()
        return await service.list_by_client(ctx.client_id)
    except InboundOrderNotFoundError:
        return []
    except Exception as e:
        logger.error(f"Unexpected error listing inbound orders: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.get(
    "/client/{client_id}",
    response_model=list[InboundOrderResponse],
    status_code=status.HTTP_200_OK,
)
async def list_inbound_orders_by_client(
    client_id: UUID,
    ctx: Annotated[ClientContext, Depends(get_client_context)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    if not ctx.is_staff and client_id != ctx.client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    service = InboundOrderService(db)
    try:
        return await service.list_by_client(client_id)
    except InboundOrderNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(
            f"Unexpected error listing inbound orders for client {client_id}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.get(
    "/{order_id}",
    response_model=InboundOrderResponse,
    status_code=status.HTTP_200_OK,
)
async def get_inbound_order(
    order_id: UUID,
    ctx: Annotated[ClientContext, Depends(get_client_context)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = InboundOrderService(db)
    try:
        order = await service.get_by_id(order_id)
        if not ctx.is_staff and order.client_id != ctx.client_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Not found",
            )
        return order
    except HTTPException:
        raise
    except InboundOrderNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error fetching inbound order {order_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.patch(
    "/{order_id}",
    response_model=InboundOrderResponse,
    status_code=status.HTTP_200_OK,
)
async def update_inbound_order(
    order_id: UUID,
    payload: InboundOrderUpdate,
    ctx: Annotated[ClientContext, Depends(get_client_context)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = InboundOrderService(db)
    try:
        if not ctx.is_staff:
            existing = await service.get_by_id(order_id)
            if existing.client_id != ctx.client_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Not found",
                )
        return await service.update(order_id, payload)
    except HTTPException:
        raise
    except InboundOrderNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error updating inbound order {order_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.patch(
    "/{order_id}/status",
    response_model=InboundOrderResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(UserRole.ADMIN, UserRole.OPERATOR))],
)
async def update_inbound_order_status(
    order_id: UUID,
    payload: InboundOrderStatusUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = InboundOrderService(db)
    try:
        return await service.update_status(order_id, payload.status)
    except InboundOrderNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        ) from e
    except InboundOrderStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "CONFLICT", "message": str(e)},
        ) from e
    except InventoryConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "CONFLICT", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(
            f"Unexpected error updating status of inbound order {order_id}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.delete(
    "/{order_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role(UserRole.ADMIN, UserRole.OPERATOR))],
)
async def delete_inbound_order(
    order_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]
):
    service = InboundOrderService(db)
    try:
        await service.delete(order_id)
    except InboundOrderNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error deleting inbound order {order_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e
    return None
