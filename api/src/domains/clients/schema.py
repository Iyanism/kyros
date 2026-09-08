from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr


class ClientCreate(BaseModel):
    name: str
    email: EmailStr
    phone_number: str
    address: str
    city: str
    state: str
    pin_code: int
    gstin: str | None = None


class ClientResponse(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    phone_number: str
    address: str
    city: str
    state: str
    pin_code: int
    gstin: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ClientUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    phone_number: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    pin_code: int | None = None
    gstin: str | None = None
