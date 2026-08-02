from sqlite3.dbapi2 import IntegrityError
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger import logger
from src.domains.clients.model import Client
from src.domains.clients.repository import ClientRepository
from src.domains.clients.schema import ClientCreate, ClientResponse, ClientUpdate


class ClientNotFoundError(Exception):
    pass


class ClientService:
    def __init__(self, db: AsyncSession):
        self.repo: ClientRepository = ClientRepository(db)
        self.db: AsyncSession = db

    async def get_by_id(self, client_id: UUID) -> ClientResponse:
        client = await self.repo.get_by_id(client_id)
        if client is None:
            raise ClientNotFoundError(f"no client with client id {client_id} found")

        return ClientResponse.model_validate(client)

    async def create(self, client_data: ClientCreate) -> ClientResponse:
        existing = await self.repo.get_by_email(client_data.email)
        if existing is not None:
            raise ValueError("Client with this email already exist.")

        client: Client = Client(**client_data.model_dump())
        try:
            client = await self.repo.create(client)
        except IntegrityError:
            raise ValueError("A client with this email already exists")
        except Exception:
            logger.info("DataBase Error during creation of use")
            raise

        logger.info(
            f"Client created: id: {client.id} name:{client.name} email: {client.email}"
        )
        return ClientResponse.model_validate(client)

    async def delete(self, client_id: UUID) -> None:
        deleted = await self.repo.delete(client_id)
        if not deleted:
            raise ClientNotFoundError(f"no client with client id {client_id} found")

    async def deactivate(self, client_id: UUID) -> None:
        deactive = await self.repo.deactivate(client_id)
        if not deactive:
            raise ClientNotFoundError(f"no client with client id {client_id} found")

    async def list(self) -> list[ClientResponse]:
        clients = await self.repo.list_all()
        if not clients:
            raise ClientNotFoundError("No client found")
        logger.info("Sending List of Clients details")
        return [ClientResponse.model_validate(client) for client in clients]

    async def update(
        self, client_id: UUID, update_data: ClientUpdate
    ) -> ClientResponse:
        try:
            client = await self.repo.update(
                client_id, update_data.model_dump(exclude_unset=True)
            )
            if client is None:
                raise ClientNotFoundError(f"no client with client id {client_id} found")
        except Exception as e:
            logger.error(
                f"Error updating details of client with client id {client_id} and name {update_data.name}: {e}"
            )
            raise

        logger.info(
            f"Details updated: id:{client_id} name:{client.name} email:{client.email}"
        )
        return ClientResponse.model_validate(client)
