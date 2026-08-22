from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import get_current_user
from src.core.logger import logger
from src.domains.warehouse.schema import (
    ChamberCreate,
    ChamberResponse,
    RackResponse,
    SlotResponse,
)
from src.domains.warehouse.service import (
    WarehouseConflictError,
    WarehouseDuplicateError,
    WarehouseNotFoundError,
    WarehouseService,
)

router = APIRouter(
    prefix="/warehouses",
    tags=["Warehouses"],
    dependencies=[Depends(get_current_user)],
)


@router.post(
    "/chambers", response_model=ChamberResponse, status_code=status.HTTP_201_CREATED
)
async def create_chamber(
    payload: ChamberCreate, db: Annotated[AsyncSession, Depends(get_db)]
):
    service = WarehouseService(db)
    try:
        return await service.create_chamber(payload)
    except WarehouseDuplicateError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "ALREADY_EXISTS",
                "message": str(e),
            },
        ) from e
    except WarehouseConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "CONFLICT",
                "message": str(e),
            },
        ) from e
    except WarehouseNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "NOT_FOUND",
                "message": str(e),
            },
        ) from e
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "VALIDATION_ERROR",
                "message": str(e),
            },
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error creating chamber: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.get(
    "/chambers", response_model=list[ChamberResponse], status_code=status.HTTP_200_OK
)
async def list_chambers(db: Annotated[AsyncSession, Depends(get_db)]):
    service = WarehouseService(db)
    try:
        return await service.list_chambers()
    except WarehouseNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error listing chambers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.get(
    "/chambers/{chamber_id}",
    response_model=ChamberResponse,
    status_code=status.HTTP_200_OK,
)
async def get_chamber(chamber_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    service = WarehouseService(db)
    try:
        return await service.get_chamber(chamber_id)
    except WarehouseNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error fetching chamber {chamber_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.delete("/chambers/{chamber_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chamber(
    chamber_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]
):
    service = WarehouseService(db)
    try:
        await service.delete_chamber(chamber_id)
    except WarehouseNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        ) from e
    except WarehouseConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "CONFLICT",
                "message": "Cannot delete chamber. Please clear all goods first.",
            },
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error deleting chamber {chamber_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e
    return None


@router.get(
    "/chambers/{chamber_id}/racks",
    response_model=list[RackResponse],
    status_code=status.HTTP_200_OK,
)
async def list_racks(chamber_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    service = WarehouseService(db)
    try:
        return await service.list_racks(chamber_id)
    except WarehouseNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error listing racks for chamber {chamber_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.get(
    "/racks/{rack_id}", response_model=RackResponse, status_code=status.HTTP_200_OK
)
async def get_rack(rack_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    service = WarehouseService(db)
    try:
        return await service.get_rack(rack_id)
    except WarehouseNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error fetching rack {rack_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.post(
    "/chambers/{chamber_id}/racks",
    response_model=RackResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_rack(
    chamber_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    slots_per_rack: int = 10,
    rack_number: str | None = None,
):
    service = WarehouseService(db)
    try:
        return await service.add_rack(chamber_id, slots_per_rack, rack_number)
    except WarehouseNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        ) from e
    except WarehouseDuplicateError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "ALREADY_EXISTS", "message": str(e)},
        ) from e
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VALIDATION_ERROR", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error adding rack to chamber {chamber_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.delete("/racks/{rack_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rack(rack_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    service = WarehouseService(db)
    try:
        await service.delete_rack(rack_id)
    except WarehouseNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        ) from e
    except WarehouseConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "CONFLICT",
                "message": "Cannot delete rack. Please clear all goods first.",
            },
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error deleting rack {rack_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e
    return None


@router.get(
    "/racks/{rack_id}/slots",
    response_model=list[SlotResponse],
    status_code=status.HTTP_200_OK,
)
async def list_slots(rack_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    service = WarehouseService(db)
    try:
        return await service.list_slots(rack_id)
    except WarehouseNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error listing slots for rack {rack_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.get(
    "/slots/{slot_id}", response_model=SlotResponse, status_code=status.HTTP_200_OK
)
async def get_slot(slot_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    service = WarehouseService(db)
    try:
        return await service.get_slot(slot_id)
    except WarehouseNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error fetching slot {slot_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e


@router.delete("/slots/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_slot(slot_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    service = WarehouseService(db)
    try:
        await service.delete_slot(slot_id)
    except WarehouseNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": str(e)},
        ) from e
    except WarehouseConflictError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "CONFLICT",
                "message": "Cannot delete slot. Please clear goods first.",
            },
        ) from None
    except Exception as e:
        logger.error(f"Unexpected error deleting slot {slot_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        ) from e
    return None
