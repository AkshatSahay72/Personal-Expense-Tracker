from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend import crud, models, schemas
from backend.database import engine, Base, get_db

# Create SQLite database tables if they do not exist
Base.metadata.create_all(bind=engine)

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

@app.post("/expenses", response_model=schemas.ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(expense: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    """
    Create a new expense transaction.
    """
    return crud.create_expense(db=db, expense=expense)

