"""Central model registry — import for side-effect to populate Base.metadata.

Importing this module registers all SQLAlchemy models with Base.
Used by `alembic/env.py` and `tests/conftest.py` (via `src.main`)
for autogenerate / create_all. Keep explicit — auto-discovery hides drift.
"""

from src.domains.clients.model import Client  # noqa: F401
from src.domains.inventory.model import Pallet, SlotAllocation  # noqa: F401
from src.domains.orders.model import InboundOrder, OrderItem  # noqa: F401
from src.domains.users.model import User  # noqa: F401
from src.domains.warehouse.model import Chamber, Rack, Slot  # noqa: F401

__all__ = [
    "Chamber",
    "Client",
    "InboundOrder",
    "OrderItem",
    "Rack",
    "Slot",
    "User",
    "Pallet",
    "SlotAllocation",
]
