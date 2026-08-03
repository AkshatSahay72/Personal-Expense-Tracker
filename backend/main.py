from fastapi import FastAPI

app = FastAPI(
    title="Personal Expense Tracker API",
    description="A simple FastAPI backend for managing personal expenses",
    version="1.0.0"
)

@app.get("/")
def read_root():
    """
    Root endpoint to verify the API is running.
    """
    return {"message": "Welcome to the Personal Expense Tracker API. Use /docs to view the API documentation."}

@app.get("/health")
def health_check():
    """
    Health check endpoint for container and deployment monitoring.
    """
    return {"status": "healthy"}
