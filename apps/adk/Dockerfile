# Python backend with FastAPI and Google ADK
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy ALL application files including databases
COPY . /app/

# Explicitly verify database file exists and show size
RUN if [ -f "/app/orchestration_agent/database/customers.db" ]; then \
        echo "SUCCESS: Database file found!" && \
        ls -lh /app/orchestration_agent/database/customers.db && \
        du -h /app/orchestration_agent/database/customers.db; \
    else \
        echo "ERROR: Database file NOT found!" && \
        ls -la /app/orchestration_agent/database/ && \
        exit 1; \
    fi

# Create cache directory
RUN mkdir -p /app/cache

# Create non-root user
RUN useradd -m -u 1001 appuser && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
