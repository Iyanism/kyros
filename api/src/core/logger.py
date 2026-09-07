import logging
import sys
from logging.handlers import QueueHandler, QueueListener, TimedRotatingFileHandler
from pathlib import Path
from queue import Queue

from src.core.config import settings

LOG_DIR = Path(str(getattr(settings, "LOG_DIR", "logs")))


def setup_logger(name: str = "coldchain") -> logging.Logger:
    """Configures non-blocking, asynchronous-safe logger with daily rotation."""

    # 1. Ensure log directory exists dynamically
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    # Avoid adding duplicate handlers if already initialized
    if logger.handlers:
        return logger

    # Shared log entry format
    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # 2. Console Handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)

    # 3. Rotating File Handler (Rotates automatically at midnight, keeps 30 days)
    file_handler = TimedRotatingFileHandler(
        filename=LOG_DIR / "coldchain.log",
        when="midnight",
        interval=1,
        backupCount=30,
        encoding="utf-8",
    )
    file_handler.suffix = "%Y-%m-%d.log"
    file_handler.setFormatter(formatter)

    # 4. Non-Blocking Async Queue Wrapper
    # Dispatches log writes to a background worker thread so event loop is never blocked
    log_queue: Queue = Queue(-1)
    queue_handler = QueueHandler(log_queue)

    listener = QueueListener(
        log_queue,
        console_handler,
        file_handler,
        respect_handler_level=True,
    )
    listener.start()

    logger.addHandler(queue_handler)
    return logger


# Main Application Logger Instance
logger = setup_logger()
