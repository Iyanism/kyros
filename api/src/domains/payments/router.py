from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import get_current_user, require_role
from src.core.logger import logger
from src.domains.payments.schema import (
    ConfirmPaymentRequest,
    CreatePaymentRequest,
    PaymentDetailResponse,
)
from src.domains.payments.service import PaymentService, build_receipt_pdf
from src.domains.users.model import UserRole

router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
    dependencies=[Depends(get_current_user)],
)


@router.post(
    "",
    response_model=PaymentDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_payment(
    payload: CreatePaymentRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = PaymentService(db)
    try:
        payment = await service.create_payment(
            invoice_id=payload.invoice_id,
            method=payload.method,
        )
        return await service.get_payment(payment.id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "CONFLICT", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error creating payment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.post(
    "/{payment_id}/confirm",
    response_model=PaymentDetailResponse,
    status_code=status.HTTP_200_OK,
)
async def confirm_payment(
    payment_id: UUID,
    payload: ConfirmPaymentRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = PaymentService(db)
    try:
        payment = await service.confirm_payment(
            payment_id=payment_id,
            razorpay_order_id=payload.razorpay_order_id,
            razorpay_payment_id=payload.razorpay_payment_id,
            razorpay_signature=payload.razorpay_signature,
        )
        return await service.get_payment(payment.id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "CONFLICT", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error confirming payment {payment_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.get(
    "",
    response_model=list[PaymentDetailResponse],
    status_code=status.HTTP_200_OK,
)
async def list_payments(db: Annotated[AsyncSession, Depends(get_db)]):
    service = PaymentService(db)
    try:
        return await service.list_payments()
    except Exception as e:
        logger.error(f"Unexpected error listing payments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.get(
    "/{payment_id}",
    response_model=PaymentDetailResponse,
    status_code=status.HTTP_200_OK,
)
async def get_payment(
    payment_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]
):
    service = PaymentService(db)
    try:
        return await service.get_payment(payment_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error getting payment {payment_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.get(
    "/client/{client_id}",
    response_model=list[PaymentDetailResponse],
    status_code=status.HTTP_200_OK,
)
async def list_payments_by_client(
    client_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]
):
    service = PaymentService(db)
    try:
        return await service.list_payments_by_client(client_id)
    except Exception as e:
        logger.error(f"Unexpected error listing payments for client {client_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.get(
    "/invoice/{invoice_id}",
    response_model=PaymentDetailResponse,
    status_code=status.HTTP_200_OK,
)
async def get_payment_by_invoice(
    invoice_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]
):
    service = PaymentService(db)
    try:
        return await service.get_payment_by_invoice(invoice_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(
            f"Unexpected error getting payment for invoice {invoice_id}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.post(
    "/{payment_id}/refund",
    response_model=PaymentDetailResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
async def refund_payment(
    payment_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]
):
    service = PaymentService(db)
    try:
        payment = await service.refund_payment(payment_id)
        return await service.get_payment(payment.id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "CONFLICT", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error refunding payment {payment_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.get(
    "/{payment_id}/receipt",
    status_code=status.HTTP_200_OK,
)
async def download_receipt(
    payment_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]
):
    service = PaymentService(db)
    try:
        detail = await service.get_payment(payment_id)
        payment_dict = detail.model_dump()
        invoice_dict = {"invoice_number": detail.invoice_number}
        client_dict = {
            "name": detail.client_name,
            "address": "",
            "gstin": "",
            "state": "",
        }
        pdf_bytes = build_receipt_pdf(payment_dict, invoice_dict, client_dict)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": (
                    f'attachment; filename="{detail.receipt_number or payment_id}.pdf"'
                )
            },
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(
            f"Unexpected error generating receipt for payment {payment_id}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e
