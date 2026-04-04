# ---- Stage 1: Build dependencies ----
FROM python:3.12-slim AS builder

WORKDIR /build

# Install build dependencies in a virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:${PATH}"

COPY requirements.txt .
RUN /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

# ---- Stage 2: Runtime ----
FROM python:3.12-slim AS runtime

# Create non-root user for security
RUN groupadd --gid 1000 appuser && \
    useradd --uid 1000 --gid appuser --shell /bin/bash --create-home appuser

WORKDIR /app

# Copy installed dependencies from builder stage
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application code
COPY . .

# Switch to non-root user
USER appuser

# Expose the application port
EXPOSE 8000

# Health check uses stdlib urllib (no httpx sync dependency needed)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"] || exit 1

# Railway injects PORT env var — shell form required for variable expansion
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
