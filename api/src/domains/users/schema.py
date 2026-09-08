from datetime import datetime
from typing import Annotated, Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from src.domains.clients.schema import ClientResponse
from src.domains.users.model import UserRole

# --- Validation Rules ---
PhoneNumber = Annotated[
    str | None,
    Field(default=None, pattern=r"^\+?[1-9]\d{1,14}$", description="E.164 format"),
]
RawPassword = Annotated[str, Field(min_length=8, max_length=128)]


class UserBase(BaseModel):
    email: EmailStr
    full_name: Annotated[
        str, Field(min_length=2, max_length=255, strip_whitespace=True)
    ]
    phone_number: PhoneNumber = None
    role: UserRole = UserRole.CLIENT
    client_id: UUID | None = None


class UserCreate(UserBase):
    password: RawPassword

    @model_validator(mode="after")
    def validate_client_role_relationship(self) -> Self:
        if self.role == UserRole.CLIENT and self.client_id is None:
            raise ValueError("A client_id must be provided when role is 'client'.")
        if (
            self.role in (UserRole.ADMIN, UserRole.OPERATOR)
            and self.client_id is not None
        ):
            raise ValueError(
                f"Role '{self.role}' cannot be linked to a specific client_id."
            )
        return self


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    password: RawPassword | None = None
    full_name: Annotated[
        str | None,
        Field(default=None, min_length=2, max_length=255, strip_whitespace=True),
    ] = None
    phone_number: PhoneNumber = None
    role: UserRole | None = None
    client_id: UUID | None = None
    is_active: bool | None = None


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    is_active: bool
    last_login: datetime | None = None
    created_at: datetime
    updated_at: datetime


class UserClientResponse(UserResponse):
    client: ClientResponse | None = None
