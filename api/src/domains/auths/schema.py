

from pydantic import BaseModel
from pydantic.networks import EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
