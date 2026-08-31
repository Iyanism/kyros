from src.domains.auths import router as auth_router
from src.domains.clients import router as client_router
from src.domains.inventory import router as inventory_router
from src.domains.orders import router as order_router
from src.domains.users import router as user_router
from src.domains.warehouse import router as warehouse_router

__all__ = [
    "client_router",
    "user_router",
    "auth_router",
    "warehouse_router",
    "order_router",
    "inventory_router",
]
