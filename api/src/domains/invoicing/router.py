from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import ClientContext, get_client_context, require_role
from src.core.logger import logger
from src.domains.invoicing.schema import (
    GenerateInvoiceRequest,
    InvoiceDetailResponse,
    UpdateInvoiceStatusRequest,
)
from src.domains.invoicing.service import InvoiceService, build_invoice_pdf
from src.domains.users.model import UserRole

router = APIRouter(
    prefix="/invoices",
    tags=["Invoices"],
    dependencies=[Depends(get_client_context)],
)


@router.post(
    "/generate",
    response_model=InvoiceDetailResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
async def generate_invoice(
    payload: GenerateInvoiceRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = InvoiceService(db)
    try:
        invoice = await service.generate_invoice(
            client_id=payload.client_id,
            period_start=payload.billing_period_start,
            period_end=payload.billing_period_end,
            storage_daily_rate=payload.storage_daily_rate,
            handling_rate=payload.handling_rate,
        )
        return await service.get_invoice(invoice.id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "CONFLICT", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error generating invoice: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.get(
    "",
    response_model=list[InvoiceDetailResponse],
    status_code=status.HTTP_200_OK,
)
async def list_invoices(
    ctx: Annotated[ClientContext, Depends(get_client_context)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = InvoiceService(db)
    try:
        if ctx.is_staff:
            return await service.list_invoices()
        return await service.list_invoices_by_client(ctx.client_id)
    except Exception as e:
        logger.error(f"Unexpected error listing invoices: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.get(
    "/{invoice_id}",
    response_model=InvoiceDetailResponse,
    status_code=status.HTTP_200_OK,
)
async def get_invoice(
    invoice_id: UUID,
    ctx: Annotated[ClientContext, Depends(get_client_context)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = InvoiceService(db)
    try:
        invoice = await service.get_invoice(invoice_id)
        if not ctx.is_staff and invoice.client_id != ctx.client_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Not found",
            )
        return invoice
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error getting invoice {invoice_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.get(
    "/client/{client_id}",
    response_model=list[InvoiceDetailResponse],
    status_code=status.HTTP_200_OK,
)
async def list_invoices_by_client(
    client_id: UUID,
    ctx: Annotated[ClientContext, Depends(get_client_context)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    if not ctx.is_staff and client_id != ctx.client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    service = InvoiceService(db)
    try:
        return await service.list_invoices_by_client(client_id)
    except Exception as e:
        logger.error(f"Unexpected error listing invoices for client {client_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.patch(
    "/{invoice_id}/status",
    response_model=InvoiceDetailResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
async def update_invoice_status(
    invoice_id: UUID,
    payload: UpdateInvoiceStatusRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = InvoiceService(db)
    try:
        return await service.update_status(invoice_id, payload.status)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error updating invoice {invoice_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.get(
    "/{invoice_id}/pdf",
    status_code=status.HTTP_200_OK,
)
async def download_invoice_pdf(
    invoice_id: UUID,
    ctx: Annotated[ClientContext, Depends(get_client_context)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = InvoiceService(db)
    try:
        detail = await service.get_invoice(invoice_id)
        if not ctx.is_staff and detail.client_id != ctx.client_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Not found",
            )
        invoice_dict = detail.model_dump()
        client_dict = {
            "name": detail.client_name,
            "address": detail.client_address,
            "gstin": detail.client_gstin or "",
            "state": detail.client_state,
        }
        pdf_bytes = build_invoice_pdf(invoice_dict, client_dict)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": (
                    f'attachment; filename="{detail.invoice_number}.pdf"'
                )
            },
        )
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error generating PDF for invoice {invoice_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e
