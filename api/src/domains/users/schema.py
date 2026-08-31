from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr

from src.domains.clients.schema import ClientResponse
from src.domains.users.model import UserRole


class UserCreate(BaseModel):
    client_id: UUID | None = None
    email: EmailStr
    password_hash: str
    full_name: str
    phone_number: str | None = None
    role: UserRole


class UserResponse(BaseModel):
    id: UUID
    client_id: UUID | None = None
    email: EmailStr
    full_name: str
    phone_number: str | None = None
    role: UserRole
    is_active: bool
    last_login: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config: ConfigDict = ConfigDict(from_attributes=True)  # pyright: ignore[reportIncompatibleVariableOverride]


class UserClientResponse(UserResponse):
    client: ClientResponse | None = None


class UserUpdate(BaseModel):
    client_id: UUID | None = None
    email: EmailStr | None = None
    password_hash: str | None = None
    full_name: str | None = None
    phone_number: str | None = None
    role: UserRole | None = None
    is_active: bool | None = None
    last_login: datetime | None = None
