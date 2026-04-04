"""pytest configuration — shared fixtures for the test suite."""

from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient

# Set required env vars BEFORE importing the app module so that
# pydantic-settings doesn't raise a validation error at import time.
os.environ.setdefault("AI_SERVICE_API_KEY", "test-api-key-for-pytest")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:3000")
os.environ.setdefault("LOG_LEVEL", "WARNING")


@pytest.fixture(scope="session")
def api_key() -> str:
    """Return the API key used across tests."""
    return "test-api-key-for-pytest"


@pytest.fixture(scope="session")
def client() -> TestClient:
    """Provide a ``TestClient`` backed by the real FastAPI app."""
    from app.main import app  # noqa: WPS433 — intentional late import after env set

    with TestClient(app) as tc:
        yield tc
