from src.domains.auths import router as auth_router
from src.domains.clients import router as client_router
from src.domains.inbound_orders import router as order_router
from src.domains.inventory import router as inventory_router
from src.domains.invoicing import router as invoicing_router
from src.domains.outbound_orders import router as outbound_order_router
from src.domains.payments import router as payments_router
from src.domains.stock_movements import router as stock_movement_router
from src.domains.users import router as user_router
from src.domains.warehouse import router as warehouse_router

__all__ = [
    "client_router",
    "user_router",
    "auth_router",
    "warehouse_router",
    "order_router",
    "inventory_router",
    "outbound_order_router",
    "stock_movement_router",
    "invoicing_router",
    "payments_router",
]
