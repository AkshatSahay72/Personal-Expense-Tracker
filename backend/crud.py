import datetime
from sqlalchemy import func
from sqlalchemy.orm import Session
from backend import models, schemas

def get_expense(db: Session, expense_id: int):
    """
    Retrieve a single expense by its ID.
    """
    return db.query(models.Expense).filter(models.Expense.id == expense_id).first()

def get_expenses(db: Session, skip: int = 0, limit: int = 100):
    """
    Retrieve a list of expenses with pagination support.
    Ordered by date descending (newest first).
    """
    return db.query(models.Expense).order_by(models.Expense.date.desc()).offset(skip).limit(limit).all()

def create_expense(db: Session, expense: schemas.ExpenseCreate):
    """
    Insert a new expense into the database.
    """
    db_expense = models.Expense(
        title=expense.title,
        amount=expense.amount,
        category=expense.category,
        date=expense.date,
        notes=expense.notes
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

def update_expense(db: Session, db_expense: models.Expense, expense: schemas.ExpenseUpdate):
    """
    Update the fields of an existing database expense.
    """
    db_expense.title = expense.title
    db_expense.amount = expense.amount
    db_expense.category = expense.category
    db_expense.date = expense.date
    db_expense.notes = expense.notes
    
    db.commit()
    db.refresh(db_expense)
    return db_expense

def delete_expense(db: Session, db_expense: models.Expense):
    """
    Delete an expense from the database.
    """
    db.delete(db_expense)
    db.commit()
    return db_expense

def get_budget(db: Session):
    """
    Get current monthly budget setting or initialize default (30,000).
    """
    budget = db.query(models.Budget).first()
    if not budget:
        budget = models.Budget(monthly_limit=30000.0)
        db.add(budget)
        db.commit()
        db.refresh(budget)
    return budget

def set_budget(db: Session, monthly_limit: float):
    """
    Update the monthly budget limit.
    """
    budget = get_budget(db)
    budget.monthly_limit = monthly_limit
    db.commit()
    db.refresh(budget)
    return budget

def get_expense_summary(db: Session):
    """
    Calculate summary stats: total spending, count of records, category breakdown, and monthly budget progress.
    """
    total = db.query(func.sum(models.Expense.amount)).scalar() or 0.0
    count = db.query(func.count(models.Expense.id)).scalar() or 0
    
    group_results = db.query(
        models.Expense.category,
        func.sum(models.Expense.amount)
    ).group_by(models.Expense.category).all()
    
    breakdown = {category: amount for category, amount in group_results}
    
    # Ensure all defined categories exist in the breakdown dictionary
    for cat in schemas.ExpenseCategory:
        if cat.value not in breakdown:
            breakdown[cat.value] = 0.0
            
    # Calculate current calendar month spending
    today_str = datetime.date.today().strftime('%Y-%m')
    current_month_spending = db.query(func.sum(models.Expense.amount)).filter(
        func.strftime('%Y-%m', models.Expense.date) == today_str
    ).scalar() or 0.0

    budget_obj = get_budget(db)
    monthly_budget = budget_obj.monthly_limit
    budget_pct = round((current_month_spending / monthly_budget) * 100, 1) if monthly_budget > 0 else 0.0

    return {
        "total_spending": total,
        "transaction_count": count,
        "category_breakdown": breakdown,
        "monthly_budget": monthly_budget,
        "current_month_spending": current_month_spending,
        "budget_percentage_used": budget_pct
    }


