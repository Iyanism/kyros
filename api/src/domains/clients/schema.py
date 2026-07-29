from datetime import datetime
from uuid import UUID

from pydantic import BaseModel
from pydantic.networks import EmailStr


class ClientCreate(BaseModel):
    name: str
    email: EmailStr
    phone_number: str
    address: str
    city: str
    state: str
    pin_code: int
    gstin: str | None = None


class ClientResponse(ClientCreate):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ClientUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    phone_number: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    pin_code: int | None = None
    gstin: str | None = None
    is_active: bool | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
