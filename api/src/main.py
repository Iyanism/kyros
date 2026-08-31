from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import src.domains.models  # noqa: F401  # pyright: ignore[reportUnusedImport]
from src.core.config import settings
from src.domains import (
    auth_router,
    client_router,
    inventory_router,
    order_router,
    user_router,
    warehouse_router,
)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_headers=["*"],
    allow_methods=["*"],
)

app.include_router(user_router.router)
app.include_router(client_router.router)
app.include_router(auth_router.router)
app.include_router(warehouse_router.router)
app.include_router(order_router.router)
app.include_router(inventory_router.router)
