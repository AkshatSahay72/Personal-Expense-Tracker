from datetime import date
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
    date: date = Field(..., description="Date of the expense (YYYY-MM-DD)")
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
