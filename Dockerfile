# Use an official, lightweight Python base image
FROM python:3.10-slim

# Set the working directory inside the container
WORKDIR /app

# Set environment variables:
# PYTHONDONTWRITEBYTECODE: Prevents Python from writing .pyc files to disc
# PYTHONUNBUFFERED: Prevents Python from buffering stdout and stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Copy the requirements file into the container
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application files and frontend assets
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Create database directory, define env variable, and register it as a volume for persistence
RUN mkdir -p /app/data
ENV DATABASE_DIR=/app/data
VOLUME /app/data

# Expose port 8000 for the FastAPI server
EXPOSE 8000

# Command to run the application using uvicorn, respecting PORT env variable for Render
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
