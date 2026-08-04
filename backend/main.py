from typing import List
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
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

@app.get("/expenses", response_model=List[schemas.ExpenseResponse])
def read_expenses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve all expenses with pagination (default newest first).
    """
    return crud.get_expenses(db=db, skip=skip, limit=limit)

@app.put("/expenses/{expense_id}", response_model=schemas.ExpenseResponse)
def update_expense(expense_id: int, expense: schemas.ExpenseUpdate, db: Session = Depends(get_db)):
    """
    Update an existing expense transaction.
    """
    db_expense = crud.get_expense(db, expense_id=expense_id)
    if db_expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return crud.update_expense(db=db, db_expense=db_expense, expense=expense)

@app.delete("/expenses/{expense_id}", response_model=schemas.ExpenseResponse)
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    """
    Delete an existing expense transaction.
    """
    db_expense = crud.get_expense(db, expense_id=expense_id)
    if db_expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return crud.delete_expense(db=db, db_expense=db_expense)

@app.get("/summary", response_model=schemas.ExpenseSummaryResponse)
def read_summary(db: Session = Depends(get_db)):
    """
    Get aggregated dashboard summary metrics (total spending, count, category grouping, monthly budget).
    """
    return crud.get_expense_summary(db=db)

@app.get("/budget", response_model=schemas.BudgetResponse)
def read_budget(db: Session = Depends(get_db)):
    """
    Get current monthly budget limit target.
    """
    return crud.get_budget(db=db)

@app.put("/budget", response_model=schemas.BudgetResponse)
def update_budget(budget: schemas.BudgetUpdate, db: Session = Depends(get_db)):
    """
    Update monthly budget limit target.
    """
    return crud.set_budget(db=db, monthly_limit=budget.monthly_limit)

# Mount the static frontend directory to serve the frontend single page app
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")





