from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr

from domains.users.model import UserRole


class UserCreate(BaseModel):
    client_id: UUID | None = None
    email: EmailStr
    password: str
    full_name: str
    phone_number: str | None = None
    role: UserRole


class UserResponse(UserCreate):
    id: UUID
    is_active: bool
    last_login: datetime | None = None
    created_at: datetime
    updated_at: datetime


class UserUpdate(BaseModel):
    client_id: UUID | None = None
    email: EmailStr | None = None
    password: str | None = None
    full_name: str | None = None
    phone_number: str | None = None
    role: UserRole | None = None
    is_active: bool | None = None
    last_login: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
