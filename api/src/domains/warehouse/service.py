from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger import logger
from src.domains.warehouse.model import Chamber, Rack, Slot, SlotStatus
from src.domains.warehouse.repository import (
    ChamberRepository,
    RackRepository,
    SlotRepository,
)
from src.domains.warehouse.schema import (
    ChamberCreate,
    ChamberDetailResponse,
    ChamberResponse,
    RackDetailResponse,
    RackResponse,
    SlotResponse,
)


class WarehouseNotFoundError(ValueError):
    pass


class WarehouseConflictError(ValueError):
    pass


class WarehouseDuplicateError(ValueError):
    pass


class WarehouseValidationError(ValueError):
    pass


class WarehouseService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.chamber_repo = ChamberRepository(db)
        self.rack_repo = RackRepository(db)
        self.slot_repo = SlotRepository(db)

    async def create_chamber(
        self, chamber_data: ChamberCreate
    ) -> ChamberDetailResponse:
        existing = await self.chamber_repo.get_by_chamber_code(chamber_data.code)
        if existing is not None:
            raise WarehouseDuplicateError("Chamber with this code already exists")

        chamber = Chamber(
            name=chamber_data.name,
            code=chamber_data.code,
            category=chamber_data.category,
            temperature=chamber_data.temperature,
        )
        rack_details: list[RackDetailResponse] = []
        try:
            chamber = await self.chamber_repo.create(chamber)
            for i in range(1, chamber_data.num_racks + 1):
                rack = Rack(
                    chamber_id=chamber.id,
                    rack_number=f"R{i:02d}",
                )
                rack = await self.rack_repo.create(rack)
                slot_responses: list[SlotResponse] = []
                for bay in range(1, chamber_data.bays_per_rack + 1):
                    for level in range(1, chamber_data.levels_per_rack + 1):
                        location_code = (
                            f"{chamber.code}-{rack.rack_number}"
                            f"-B{bay:02d}-L{level:02d}"
                        )
                        slot = Slot(
                            rack_id=rack.id,
                            bay=bay,
                            level=level,
                            depth=1,
                            location_code=location_code,
                            status=SlotStatus.AVAILABLE,
                        )
                        slot = await self.slot_repo.create(slot)
                        slot_responses.append(self._to_slot_response(slot))
                rack_details.append(
                    RackDetailResponse(
                        id=rack.id,
                        chamber_id=rack.chamber_id,
                        rack_number=rack.rack_number,
                        full_code=rack.full_code,
                        slot_count=len(slot_responses),
                        occupied_count=0,
                        status=rack.status,
                        created_at=rack.created_at,
                        updated_at=rack.updated_at,
                        slots=slot_responses,
                    )
                )
        except IntegrityError as e:
            logger.error(f"Integrity error creating chamber {chamber_data.code}: {e}")
            raise WarehouseDuplicateError(
                "Chamber with this name or code already exists"
            ) from e
        except Exception:
            logger.error(f"Database error creating chamber {chamber_data.code}")
            raise

        total_slots = (
            chamber_data.num_racks
            * chamber_data.bays_per_rack
            * chamber_data.levels_per_rack
        )

        logger.info(
            f"Chamber created: id={chamber.id} name={chamber.name} code={chamber.code} "
            f"category={chamber.category} temperature={chamber.temperature} "
            f"with {chamber_data.num_racks} racks and {total_slots} slots"
        )
        return ChamberDetailResponse(
            id=chamber.id,
            name=chamber.name,
            code=chamber.code,
            category=chamber.category,
            temperature=chamber.temperature,
            status=chamber.status,
            total_racks=chamber_data.num_racks,
            total_slots=total_slots,
            total_capacity=float(total_slots),
            used_capacity=0.0,
            created_at=chamber.created_at,
            updated_at=chamber.updated_at,
            racks=rack_details,
        )

    async def get_chamber(self, chamber_id: UUID) -> ChamberResponse:
        chamber = await self.chamber_repo.get_by_id(chamber_id)
        if chamber is None:
            raise WarehouseNotFoundError("Chamber not found")

        total_slots = await self.slot_repo.count_by_chamber(chamber_id)
        total_occupied = await self.slot_repo.count_occupied_by_chamber(chamber_id)
        total_racks = await self.rack_repo.count_by_chamber(chamber_id)

        return self._to_chamber_response(chamber, total_racks, total_slots, total_occupied)

    async def get_chamber_detail(self, chamber_id: UUID) -> ChamberDetailResponse:
        chamber = await self.chamber_repo.get_with_details(chamber_id)
        if chamber is None:
            raise WarehouseNotFoundError("Chamber not found")

        total_slots = 0
        total_occupied = 0
        rack_details: list[RackDetailResponse] = []
        for rack in chamber.racks:
            occupied = sum(
                1 for s in rack.slots if s.status == SlotStatus.OCCUPIED
            )
            total_slots += len(rack.slots)
            total_occupied += occupied
            rack_details.append(
                RackDetailResponse(
                    id=rack.id,
                    chamber_id=rack.chamber_id,
                    rack_number=rack.rack_number,
                    full_code=rack.full_code,
                    slot_count=len(rack.slots),
                    occupied_count=occupied,
                    status=rack.status,
                    created_at=rack.created_at,
                    updated_at=rack.updated_at,
                    slots=[self._to_slot_response(s) for s in rack.slots],
                )
            )

        return ChamberDetailResponse(
            id=chamber.id,
            name=chamber.name,
            code=chamber.code,
            category=chamber.category,
            temperature=chamber.temperature,
            status=chamber.status,
            total_racks=len(rack_details),
            total_slots=total_slots,
            total_capacity=float(total_slots),
            used_capacity=float(total_occupied),
            created_at=chamber.created_at,
            updated_at=chamber.updated_at,
            racks=rack_details,
        )

    async def delete_chamber(self, chamber_id: UUID) -> None:
        chamber = await self.chamber_repo.get_by_id(chamber_id)
        if chamber is None:
            raise WarehouseNotFoundError("Chamber not found")

        total_occupied = await self.slot_repo.count_occupied_by_chamber(chamber_id)
        if total_occupied > 0:
            raise WarehouseConflictError(
                "Slots are still occupied by goods, remove them to delete chamber"
            )

        deleted = await self.chamber_repo.delete_by_id(chamber_id)
        if not deleted:
            raise WarehouseNotFoundError("Chamber not found")

    async def list_chambers(self) -> list[ChamberResponse]:
        chambers = await self.chamber_repo.list_all()
        if not chambers:
            return []

        responses: list[ChamberResponse] = []
        for chamber in chambers:
            total_slots = await self.slot_repo.count_by_chamber(chamber.id)
            total_occupied = await self.slot_repo.count_occupied_by_chamber(chamber.id)
            total_racks = await self.rack_repo.count_by_chamber(chamber.id)
            responses.append(
                self._to_chamber_response(chamber, total_racks, total_slots, total_occupied)
            )
        return responses

    async def list_racks(self, chamber_id: UUID) -> list[RackResponse]:
        chamber = await self.chamber_repo.get_by_id(chamber_id)
        if chamber is None:
            raise WarehouseNotFoundError("Chamber not found")

        racks = await self.rack_repo.list_by_chamber_with_details(chamber_id)
        if not racks:
            return []

        return [self._to_rack_response(rack) for rack in racks]

    async def get_rack(self, rack_id: UUID) -> RackResponse:
        rack = await self.rack_repo.get_with_slots(rack_id)
        if rack is None:
            raise WarehouseNotFoundError("Rack not found")

        return self._to_rack_response(rack)

    async def add_rack(
        self,
        chamber_id: UUID,
        bays_per_rack: int = 5,
        levels_per_rack: int = 2,
        rack_number: str | None = None,
    ) -> RackResponse:
        chamber = await self.chamber_repo.get_by_id(chamber_id)
        if chamber is None:
            raise WarehouseNotFoundError("Chamber not found")

        if rack_number is None:
            existing = await self.rack_repo.list_by_chamber(chamber_id)
            rack_number = f"R{len(existing) + 1:02d}"
        else:
            dup = await self.rack_repo.get_by_rack_number(chamber_id, rack_number)
            if dup is not None:
                raise WarehouseDuplicateError(
                    "Rack number already exists in this chamber"
                )

        if bays_per_rack < 1 or bays_per_rack > 100:
            raise WarehouseValidationError("bays_per_rack must be between 1 and 100")
        if levels_per_rack < 1 or levels_per_rack > 100:
            raise WarehouseValidationError("levels_per_rack must be between 1 and 100")

        rack = Rack(chamber_id=chamber_id, rack_number=rack_number)
        try:
            rack = await self.rack_repo.create(rack)
            for bay in range(1, bays_per_rack + 1):
                for level in range(1, levels_per_rack + 1):
                    location_code = (
                        f"{chamber.code}-{rack.rack_number}"
                        f"-B{bay:02d}-L{level:02d}"
                    )
                    slot = Slot(
                        rack_id=rack.id,
                        bay=bay,
                        level=level,
                        depth=1,
                        location_code=location_code,
                        status=SlotStatus.AVAILABLE,
                    )
                    await self.slot_repo.create(slot)
        except IntegrityError as e:
            logger.error(f"Integrity error adding rack {rack_number}: {e}")
            raise WarehouseDuplicateError("Rack already exists") from e

        rack = await self.rack_repo.get_with_chamber(rack.id)
        if rack is None:
            raise WarehouseNotFoundError("Rack not found after creation")
        total_slots = bays_per_rack * levels_per_rack
        return RackResponse(
            id=rack.id,
            chamber_id=rack.chamber_id,
            rack_number=rack.rack_number,
            full_code=rack.full_code,
            slot_count=total_slots,
            occupied_count=0,
            status=rack.status,
            created_at=rack.created_at,
            updated_at=rack.updated_at,
        )

    async def delete_rack(self, rack_id: UUID) -> None:
        rack = await self.rack_repo.get_by_id(rack_id)
        if rack is None:
            raise WarehouseNotFoundError("Rack not found")

        occupied = await self.slot_repo.total_occupied_slots(rack_id)
        if occupied > 0:
            raise WarehouseConflictError(
                "Rack has occupied slots, clear them before deletion"
            )

        deleted = await self.rack_repo.delete_by_id(rack_id)
        if not deleted:
            raise WarehouseNotFoundError("Rack not found")

    async def list_slots(self, rack_id: UUID) -> list[SlotResponse]:
        rack = await self.rack_repo.get_by_id(rack_id)
        if rack is None:
            raise WarehouseNotFoundError("Rack not found")

        slots = await self.slot_repo.list_by_rack_with_details(rack_id)
        if not slots:
            return []

        return [self._to_slot_response(s) for s in slots]

    async def get_slot(self, slot_id: UUID) -> SlotResponse:
        slot = await self.slot_repo.get_with_rack(slot_id)
        if slot is None:
            raise WarehouseNotFoundError("Slot not found")
        return self._to_slot_response(slot)

    async def delete_slot(self, slot_id: UUID) -> None:
        slot = await self.slot_repo.get_by_id(slot_id)
        if slot is None:
            raise WarehouseNotFoundError("Slot not found")
        if slot.status == SlotStatus.OCCUPIED:
            raise WarehouseConflictError(
                "Slot is occupied, clear goods before deletion"
            )

        deleted = await self.slot_repo.delete_by_id(slot_id)
        if not deleted:
            raise WarehouseNotFoundError("Slot not found")

    def _to_chamber_response(
        self,
        chamber: Chamber,
        total_racks: int,
        total_slots: int,
        total_occupied: int,
    ) -> ChamberResponse:
        return ChamberResponse(
            id=chamber.id,
            name=chamber.name,
            code=chamber.code,
            category=chamber.category,
            temperature=chamber.temperature,
            status=chamber.status,
            total_racks=total_racks,
            total_slots=total_slots,
            total_capacity=float(total_slots),
            used_capacity=float(total_occupied),
            created_at=chamber.created_at,
            updated_at=chamber.updated_at,
        )

    def _to_rack_response(self, rack: Rack) -> RackResponse:
        slot_count = len(rack.slots) if rack.slots else 0
        occupied_count = (
            sum(1 for s in rack.slots if s.status == SlotStatus.OCCUPIED)
            if rack.slots
            else 0
        )
        return RackResponse(
            id=rack.id,
            chamber_id=rack.chamber_id,
            rack_number=rack.rack_number,
            full_code=rack.full_code,
            slot_count=slot_count,
            occupied_count=occupied_count,
            status=rack.status,
            created_at=rack.created_at,
            updated_at=rack.updated_at,
        )

    def _to_slot_response(self, slot: Slot) -> SlotResponse:
        return SlotResponse(
            id=slot.id,
            rack_id=slot.rack_id,
            bay=slot.bay,
            level=slot.level,
            depth=slot.depth,
            location_code=slot.location_code,
            status=slot.status,
            allocated_client_id=slot.allocated_client_id,
            created_at=slot.created_at,
            updated_at=slot.updated_at,
        )
