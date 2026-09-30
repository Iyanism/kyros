from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

# --- Validation Rules ---
ClientPhone = Annotated[
    str, Field(pattern=r"^\d{10}$", description="Exactly 10 digits")
]
ClientPhoneOptional = Annotated[
    str | None,
    Field(default=None, pattern=r"^\d{10}$", description="Exactly 10 digits"),
]


class ClientCreate(BaseModel):
    name: str
    email: EmailStr
    phone_number: ClientPhone
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
    phone_number: ClientPhoneOptional = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    pin_code: int | None = None
    gstin: str | None = None
