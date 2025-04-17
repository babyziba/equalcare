# Base image
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y curl && apt-get clean

# Set working directory
WORKDIR /app

# --- Install backend dependencies ---
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# --- Install frontend dependencies and build ---
COPY frontend ./frontend
WORKDIR /app/frontend
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    npm install && npm run build

# --- Set up backend ---
WORKDIR /app
COPY backend ./backend

# Copy frontend build into backend's static directory
RUN mkdir -p /app/backend/static
RUN cp -r /app/frontend/build/* /app/backend/static/

# Expose the port FastAPI will run on
EXPOSE 8000

# Start FastAPI with Uvicorn and serve the static React build
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
