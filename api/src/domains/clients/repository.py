from collections.abc import Sequence
from typing import Any
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

    async def toggle_status(self, client_id: UUID) -> Client | None:
        client: Client | None = await self.get_by_id(client_id)
        if client is None:
            return None

        client.is_active = not client.is_active
        await self.db.flush()
        await self.db.refresh(client)

        return client

    async def delete(self, client_id: UUID) -> bool:
        client: Client | None = await self.get_by_id(client_id)
        if client is None:
            return False

        await self.db.delete(client)
        await self.db.flush()

        return True

    async def update(
        self, client_id: UUID, updated_data: dict[str, Any]
    ) -> Client | None:
        client: Client | None = await self.get_by_id(client_id)
        if client is None:
            return None

        updated_data.pop("id", None)

        for field, value in updated_data.items():
            setattr(client, field, value)

        await self.db.flush()
        await self.db.refresh(client)

        return client
