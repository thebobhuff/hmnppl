"""Tests for the ``GET /health`` endpoint."""

from __future__ import annotations

from fastapi.testclient import TestClient


class TestHealthEndpoint:
    """Verify health-check behaviour."""

    def test_health_returns_200(self, client: TestClient) -> None:
        """``GET /health`` should respond with HTTP 200."""
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_returns_ok_status(self, client: TestClient) -> None:
        """Response body should contain ``{"status": "ok"}``."""
        response = client.get("/health")
        body = response.json()
        assert body["status"] == "ok"

    def test_health_returns_timestamp(self, client: TestClient) -> None:
        """Response body should contain an ISO 8601 ``timestamp``."""
        response = client.get("/health")
        body = response.json()
        assert "timestamp" in body
        # Basic ISO format check — must contain 'T' separator
        assert "T" in body["timestamp"]

    def test_health_does_not_require_api_key(self, client: TestClient) -> None:
        """Health endpoint must be accessible without authentication."""
        response = client.get("/health", headers={})
        assert response.status_code == 200
