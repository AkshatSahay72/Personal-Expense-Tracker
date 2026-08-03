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
