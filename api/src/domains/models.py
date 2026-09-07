"""Central model registry — import for side-effect to populate Base.metadata.

Importing this module registers all SQLAlchemy models with Base.
Used by `alembic/env.py` and `tests/conftest.py` (via `src.main`)
for autogenerate / create_all. Keep explicit — auto-discovery hides drift.
"""

from src.domains.clients.model import Client  # noqa: F401
from src.domains.inbound_orders.model import (  # noqa: F401
    InboundOrder,
    InboundOrderItem,
)
from src.domains.inventory.model import (  # noqa: F401
    Pallet,
    PickList,
    PickRecord,
    SlotAllocation,
)
from src.domains.invoicing.model import Invoice, InvoiceLineItem  # noqa: F401
from src.domains.payments.model import Payment  # noqa: F401
from src.domains.stock_movements.model import (  # noqa: F401
    StockLevel,
    StockMovement,
)
from src.domains.outbound_orders.model import (  # noqa: F401
    OutboundOrder,
    OutboundOrderItem,
)
from src.domains.users.model import User  # noqa: F401
from src.domains.warehouse.model import Chamber, Rack, Slot  # noqa: F401

__all__ = [
    "Chamber",
    "Client",
    "InboundOrder",
    "InboundOrderItem",
    "Invoice",
    "InvoiceLineItem",
    "OutboundOrder",
    "OutboundOrderItem",
    "Pallet",
    "Payment",
    "PickList",
    "PickRecord",
    "Rack",
    "Slot",
    "SlotAllocation",
    "StockLevel",
    "StockMovement",
    "User",
]
