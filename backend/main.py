from typing import List
import datetime
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from backend import crud, models, schemas
from backend.database import engine, Base, get_db

# Create SQLite database tables if they do not exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Personal Expense Tracker API",
    description="A simple FastAPI backend for managing personal expenses with user authentication",
    version="1.0.0"
)

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Dependency to authenticate requests using database-backed session tokens.
    """
    token = credentials.credentials
    db_session = crud.get_session(db, token)
    if not db_session or db_session.expires_at < datetime.datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = crud.get_user(db, user_id=db_session.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

@app.get("/health")
def health_check():
    """
    Health check endpoint for container and deployment monitoring.
    """
    return {"status": "healthy"}

@app.post("/register", response_model=schemas.TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user and return an active session token.
    """
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    db_user = crud.create_user(db=db, user=user)
    db_session = crud.create_session(db=db, user_id=db_user.id)
    return {
        "token": db_session.token,
        "token_type": "bearer",
        "user": db_user
    }

@app.post("/login", response_model=schemas.TokenResponse)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user credentials and return an active session token.
    """
    db_user = crud.get_user_by_username(db, username=user.username)
    if not db_user or not crud.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    db_session = crud.create_session(db=db, user_id=db_user.id)
    return {
        "token": db_session.token,
        "token_type": "bearer",
        "user": db_user
    }

@app.post("/logout", status_code=status.HTTP_200_OK)
def logout(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """
    Log out the current user by invalidating the active session token.
    """
    crud.delete_session(db, credentials.credentials)
    return {"detail": "Successfully logged out"}

@app.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    """
    Get details of the currently logged-in user.
    """
    return current_user

@app.post("/expenses", response_model=schemas.ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(expense: schemas.ExpenseCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Create a new expense transaction.
    """
    return crud.create_expense(db=db, expense=expense, user_id=current_user.id)

@app.get("/expenses", response_model=List[schemas.ExpenseResponse])
def read_expenses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Retrieve all expenses with pagination (default newest first).
    """
    return crud.get_expenses(db=db, user_id=current_user.id, skip=skip, limit=limit)

@app.put("/expenses/{expense_id}", response_model=schemas.ExpenseResponse)
def update_expense(expense_id: int, expense: schemas.ExpenseUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Update an existing expense transaction.
    """
    db_expense = crud.get_expense(db, expense_id=expense_id, user_id=current_user.id)
    if db_expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return crud.update_expense(db=db, db_expense=db_expense, expense=expense)

@app.delete("/expenses/{expense_id}", response_model=schemas.ExpenseResponse)
def delete_expense(expense_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Delete an existing expense transaction.
    """
    db_expense = crud.get_expense(db, expense_id=expense_id, user_id=current_user.id)
    if db_expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return crud.delete_expense(db=db, db_expense=db_expense)

@app.get("/summary", response_model=schemas.ExpenseSummaryResponse)
def read_summary(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Get aggregated dashboard summary metrics (total spending, count, category grouping, monthly budget).
    """
    return crud.get_expense_summary(db=db, user_id=current_user.id)

@app.get("/budget", response_model=schemas.BudgetResponse)
def read_budget(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Get current monthly budget limit target.
    """
    return crud.get_budget(db=db, user_id=current_user.id)

@app.put("/budget", response_model=schemas.BudgetResponse)
def update_budget(budget: schemas.BudgetUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Update monthly budget limit target.
    """
    return crud.set_budget(db=db, monthly_limit=budget.monthly_limit, user_id=current_user.id)

# Mount the static frontend directory to serve the frontend single page app
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")





