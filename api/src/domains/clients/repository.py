from collections.abc import MutableMapping, Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domains.clients.model import Client


class ClientRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, client_id: UUID) -> Client | None:
        return await self.db.get(Client, client_id)

    async def get_by_email(self, client_email: str) -> Client | None:
        stmt = select(Client).where(Client.email == client_email.lower())
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, client: Client) -> Client:
        self.db.add(client)
        await self.db.flush()
        await self.db.refresh(client)
        return client

    async def list_all(self, limit: int = 10, offset: int = 0) -> Sequence[Client]:
        stmt = (
            select(Client)
            .order_by(Client.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def list_names_by_ids(self, client_ids: set[UUID]) -> dict[UUID, str]:
        if not client_ids:
            return {}
        stmt = select(Client.id, Client.name).where(Client.id.in_(client_ids))
        result = await self.db.execute(stmt)
        return dict(result.all())

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
        self, client_id: UUID, updated_data: MutableMapping[str, UUID | str | int]
    ) -> Client | None:
        client: Client | None = await self.get_by_id(client_id)
        if client is None:
            return None

        updated_data.pop("id", None)
        valid_columns = {col.name for col in Client.__table__.columns}

        for field, value in updated_data.items():
            if field in valid_columns:
                setattr(client, field, value)

        await self.db.flush()
        await self.db.refresh(client)

        return client
