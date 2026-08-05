import datetime
from enum import Enum
from typing import Optional, Dict
from pydantic import BaseModel, Field

class ExpenseCategory(str, Enum):
    """
    Enum representing allowed expense categories.
    """
    FOOD = "Food"
    SHOPPING = "Shopping"
    TRAVEL = "Travel"
    BILLS = "Bills"
    ENTERTAINMENT = "Entertainment"
    OTHER = "Other"

class ExpenseBase(BaseModel):
    """
    Base Pydantic schema for an Expense.
    """
    title: str = Field(..., min_length=1, max_length=100, description="Title of the expense")
    amount: float = Field(..., gt=0, description="Expense amount (must be positive)")
    category: ExpenseCategory = Field(..., description="Category of the expense")
    date: datetime.date = Field(..., description="Date of the expense (YYYY-MM-DD)")
    notes: Optional[str] = Field(None, max_length=500, description="Optional notes about the expense")

class ExpenseCreate(ExpenseBase):
    """
    Schema for creating a new Expense. Inherits all fields from ExpenseBase.
    """
    pass

class ExpenseUpdate(ExpenseBase):
    """
    Schema for updating an existing Expense.
    """
    pass

class ExpenseResponse(ExpenseBase):
    """
    Schema for returning an Expense in API responses.
    Includes the database-generated ID.
    """
    id: int
    user_id: Optional[int] = None

    model_config = {
        "from_attributes": True
    }

class ExpenseSummaryResponse(BaseModel):
    """
    Schema for returning the expense summary dashboard details.
    """
    total_spending: float = Field(..., description="Total spent across all transactions")
    transaction_count: int = Field(..., description="Total number of transactions")
    category_breakdown: Dict[str, float] = Field(..., description="Spending grouped by category")
    monthly_budget: float = Field(30000.0, description="Monthly budget limit target")
    current_month_spending: float = Field(0.0, description="Spending in current calendar month")
    budget_percentage_used: float = Field(0.0, description="Percentage of monthly budget used")

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Username")

class UserCreate(UserBase):
    password: str = Field(..., min_length=4, max_length=100, description="Password")

class UserLogin(BaseModel):
    username: str = Field(..., description="Username")
    password: str = Field(..., description="Password")

class UserResponse(UserBase):
    id: int

    model_config = {
        "from_attributes": True
    }

class TokenResponse(BaseModel):
    token: str = Field(..., description="Session authentication token")
    token_type: str = Field("bearer", description="Token type")
    user: UserResponse = Field(..., description="User details")

class BudgetUpdate(BaseModel):
    """
    Schema for updating monthly budget limit.
    """
    monthly_limit: float = Field(..., gt=0, description="Monthly budget target limit (must be > 0)")

class BudgetResponse(BaseModel):
    """
    Schema for returning monthly budget.
    """
    id: int
    monthly_limit: float
    user_id: Optional[int] = None

    model_config = {
        "from_attributes": True
    }
