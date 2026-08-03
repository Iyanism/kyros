

from uuid import UUID

from pydantic import BaseModel
from pydantic.networks import EmailStr

from src.domains.clients.schema import ClientCreate, ClientResponse
from src.domains.users.model import UserRole
from src.domains.users.schema import UserResponse


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: UUID
    client_id: UUID | None = None
    email: EmailStr
    role: UserRole

class RegisterUserInfo(BaseModel):
    email: EmailStr
    password_hash: str
    full_name: str
    phone_number: str | None = None

class RegistrationRequest(BaseModel):
    client: ClientCreate
    user: RegisterUserInfo

class RegistrationResponse(BaseModel):
    login_info: LoginResponse
    user: UserResponse
    client: ClientResponse
