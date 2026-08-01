from collections.abc import Mapping, Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.clients.model import Client


class ClientRepository:
    def __init__(self, db: AsyncSession):
        self.db: AsyncSession = db

    async def get_by_id(self, client_id: UUID) -> Client | None:
        return await self.db.get(Client, client_id)

    async def get_by_email(self, client_email: str) -> Client | None:
        stmt = select(Client).where(Client.email == client_email)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, client_data: Client) -> Client:
        self.db.add(client_data)
        await self.db.flush()
        await self.db.refresh(client_data)
        return client_data

    async def list_all(self) -> Sequence[Client]:
        stmt = select(Client).order_by(Client.created_at.desc())
        result = await self.db.execute(stmt)

        return result.scalars().all()

    async def deactivate(self, client_id: UUID) -> bool:
        client: Client | None = await self.get_by_id(client_id)
        if client is None:
            return False

        client.is_active = False
        await self.db.flush()
        await self.db.refresh(client)

        return True

    async def delete(self, client_id: UUID) -> bool:
        client: Client | None = await self.get_by_id(client_id)
        if client is None:
            return False

        await self.db.delete(client)
        await self.db.flush()

        return True

    async def update(
        self, client_id: UUID, updated_data: Mapping[str, UUID | str | int]
    ) -> Client | None:
        client: Client | None = await self.get_by_id(client_id)
        if client is None:
            return None

        for field, value in updated_data.items():
            setattr(client, field, value)

        await self.db.flush()
        await self.db.refresh(client)

        return client
