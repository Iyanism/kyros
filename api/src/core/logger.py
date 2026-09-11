from __future__ import annotations

import logging
import sys
from logging.handlers import QueueHandler, QueueListener, TimedRotatingFileHandler
from pathlib import Path
from queue import Queue

from src.core.config import settings

LOG_DIR = Path(str(getattr(settings, "LOG_DIR", "logs")))

_configured: set[str] = set()
_listener: QueueListener | None = None


def setup_logger(name: str = "coldchain") -> logging.Logger:
    """Configure a non-blocking, async-safe logger with daily rotation."""
    global _listener

    logger = logging.getLogger(name)

    if name in _configured:
        return logger

    logger.setLevel(getattr(settings, "LOG_LEVEL", logging.INFO))
    logger.propagate = False  # Prevent duplicate logs propagating to root

    LOG_DIR.mkdir(parents=True, exist_ok=True)

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)

    file_handler = TimedRotatingFileHandler(
        filename=LOG_DIR / "coldchain.log",
        when="midnight",
        interval=1,
        backupCount=30,
        encoding="utf-8",
    )
    file_handler.suffix = "%Y-%m-%d"
    file_handler.setFormatter(formatter)

    log_queue: Queue = Queue(-1)
    queue_handler = QueueHandler(log_queue)

    _listener = QueueListener(
        log_queue, console_handler, file_handler, respect_handler_level=True
    )
    _listener.start()

    logger.addHandler(queue_handler)

    _configured.add(name)
    return logger


def shutdown_logging() -> None:
    """Drain the queue and stop the listener thread. Call on app shutdown."""
    global _listener
    if _listener is not None:
        _listener.stop()
        _listener = None


logger = setup_logger()
