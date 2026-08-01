from src.domains.clients import router as client_router
from src.domains.users import router as user_router

__all__ = [
    "client_router",
    "user_router",
]
