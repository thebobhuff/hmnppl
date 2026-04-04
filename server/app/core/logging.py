"""Structured logging configuration.

Sets up a JSON-formatted logger suitable for production deployments
while keeping human-readable output during local development.
"""

from __future__ import annotations

import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any


class _StructuredFormatter(logging.Formatter):
    """Emit log records as single-line JSON objects."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        if record.exc_info and record.exc_info[1] is not None:
            log_entry["exception"] = self.formatException(record.exc_info)

        # Merge any extra fields attached by the caller
        extra_fields = {
            k: v
            for k, v in record.__dict__.items()
            if k not in logging.LogRecord("", 0, "", 0, "", (), None).__dict__
            and k not in {"message", "asctime"}
        }
        if extra_fields:
            log_entry["extra"] = extra_fields

        return json.dumps(log_entry, default=str)


def setup_logging(level: str = "INFO") -> None:
    """Configure the root logger with structured JSON output.

    Args:
        level: Log level string (DEBUG, INFO, WARNING, ERROR, CRITICAL).
    """
    root = logging.getLogger()
    root.setLevel(getattr(logging, level.upper(), logging.INFO))

    # Remove existing handlers to avoid duplicates on re-initialisation
    root.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(_StructuredFormatter())
    root.addHandler(handler)


def get_logger(name: str) -> logging.Logger:
    """Return a named logger inheriting the root configuration.

    Args:
        name: Logger name — typically ``__name__`` of the calling module.
    """
    return logging.getLogger(name)
