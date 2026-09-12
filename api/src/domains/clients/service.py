from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger import logger
from src.domains.clients.model import Client
from src.domains.clients.repository import ClientRepository
from src.domains.clients.schema import ClientCreate, ClientResponse, ClientUpdate


# --- Domain Exceptions ---
class ClientError(Exception):
    """Base domain exception for Client domain."""

    pass


class ClientNotFoundError(ClientError):
    """Raised when a client resource is not found."""

    pass


class ClientAlreadyExistsError(ClientError):
    """Raised when a client email or unique field conflicts."""

    pass


class ClientService:
    def __init__(self, db: AsyncSession, repo: ClientRepository | None = None) -> None:
        self.db = db
        self.repo = repo or ClientRepository(db)

    async def get_by_id(self, client_id: UUID) -> ClientResponse:
        client = await self.repo.get_by_id(client_id)
        if client is None:
            raise ClientNotFoundError(f"Client with ID '{client_id}' not found.")

        return ClientResponse.model_validate(client)

    async def create(self, client_data: ClientCreate) -> ClientResponse:
        client = Client(**client_data.model_dump())
        try:
            client = await self.repo.create(client)
        except IntegrityError as e:
            logger.warning(
                f"Client creation failed due to unique constraint conflict: {client_data.email}"
            )
            raise ClientAlreadyExistsError(
                f"Client with email '{client_data.email}' already exists."
            ) from e

        logger.info(
            f"Client created successfully: id={client.id}, email={client.email}"
        )
        return ClientResponse.model_validate(client)

    async def list_all(self, limit: int = 10, offset: int = 0) -> list[ClientResponse]:
        clients = await self.repo.list_all(limit, offset)
        return [ClientResponse.model_validate(client) for client in clients]

    async def toggle_status(self, client_id: UUID) -> ClientResponse:
        client = await self.repo.toggle_status(client_id)
        if client is None:
            raise ClientNotFoundError(f"Client with ID '{client_id}' not found.")

        logger.info(
            f"Client status updated: id={client.id}, is_active={client.is_active}"
        )
        return ClientResponse.model_validate(client)

    async def update(
        self, client_id: UUID, update_data: ClientUpdate
    ) -> ClientResponse:
        try:
            client = await self.repo.update(
                client_id, update_data.model_dump(exclude_unset=True)
            )
            if client is None:
                raise ClientNotFoundError(f"Client with ID '{client_id}' not found.")
        except IntegrityError as e:
            logger.warning(
                f"Client update failed due to constraint conflict on ID '{client_id}'"
            )
            raise ClientAlreadyExistsError(
                "Updated details conflict with an existing client record."
            ) from e
        except Exception as e:
            logger.error(f"Error updating client ID '{client_id}': {e}", exc_info=True)
            raise

        logger.info(f"Client updated successfully: id={client_id}")
        return ClientResponse.model_validate(client)

    async def delete(self, client_id: UUID) -> None:
        deleted = await self.repo.delete(client_id)
        if not deleted:
            raise ClientNotFoundError(f"Client with ID '{client_id}' not found.")

        logger.info(f"Client deleted successfully: id={client_id}")
