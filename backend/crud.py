import hashlib
import os
import secrets
import datetime
from sqlalchemy import func
from sqlalchemy.orm import Session
from backend import models, schemas

def hash_password(password: str) -> str:
    """
    Hash a password securely using PBKDF2-HMAC-SHA256 with 100,000 iterations.
    """
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return f"{salt.hex()}:{key.hex()}"

def verify_password(password: str, hashed: str) -> bool:
    """
    Verify a password against its stored PBKDF2 hash.
    """
    try:
        salt_hex, key_hex = hashed.split(':')
        salt = bytes.fromhex(salt_hex)
        key = bytes.fromhex(key_hex)
        new_key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
        return secrets.compare_digest(key, new_key)
    except Exception:
        return False

def get_user(db: Session, user_id: int):
    """
    Retrieve a user by their ID.
    """
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_username(db: Session, username: str):
    """
    Retrieve a user by their unique username.
    """
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    """
    Create a new user, hashes the password, and associates pre-existing orphan expenses if they are the first user.
    """
    hashed = hash_password(user.password)
    db_user = models.User(username=user.username, hashed_password=hashed)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Backwards compatibility: if this is the first registered user,
    # assign all pre-existing orphan expenses to them.
    user_count = db.query(models.User).count()
    if user_count == 1:
        db.query(models.Expense).filter(models.Expense.user_id == None).update(
            {models.Expense.user_id: db_user.id},
            synchronize_session=False
        )
        db.commit()
        
    return db_user

def create_session(db: Session, user_id: int):
    """
    Create a new database-backed session token for a user.
    """
    token = secrets.token_hex(32)
    # Session valid for 30 days
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=30)
    db_session = models.UserSession(token=token, user_id=user_id, expires_at=expires_at)
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def get_session(db: Session, token: str):
    """
    Retrieve a user session by token.
    """
    return db.query(models.UserSession).filter(models.UserSession.token == token).first()

def delete_session(db: Session, token: str):
    """
    Delete/invalidate a user session by token (logout).
    """
    db_session = db.query(models.UserSession).filter(models.UserSession.token == token).first()
    if db_session:
        db.delete(db_session)
        db.commit()
    return db_session

def clean_expired_sessions(db: Session):
    """
    Remove all expired sessions from the database.
    """
    now = datetime.datetime.utcnow()
    db.query(models.UserSession).filter(models.UserSession.expires_at < now).delete()
    db.commit()

def get_expense(db: Session, expense_id: int, user_id: int):
    """
    Retrieve a single expense by its ID, filtered by user ownership.
    """
    return db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == user_id
    ).first()

def get_expenses(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    """
    Retrieve a list of expenses with pagination support, filtered by user ownership.
    Ordered by date descending (newest first).
    """
    return db.query(models.Expense).filter(
        models.Expense.user_id == user_id
    ).order_by(models.Expense.date.desc()).offset(skip).limit(limit).all()

def create_expense(db: Session, expense: schemas.ExpenseCreate, user_id: int):
    """
    Insert a new expense into the database linked to the logged-in user.
    """
    db_expense = models.Expense(
        title=expense.title,
        amount=expense.amount,
        category=expense.category,
        date=expense.date,
        notes=expense.notes,
        user_id=user_id
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

def get_expense_summary(db: Session, user_id: int):
    """
    Calculate summary stats: total spending, count of records, and category breakdown for a specific user.
    """
    total = db.query(func.sum(models.Expense.amount)).filter(models.Expense.user_id == user_id).scalar() or 0.0
    count = db.query(func.count(models.Expense.id)).filter(models.Expense.user_id == user_id).scalar() or 0
    
    group_results = db.query(
        models.Expense.category,
        func.sum(models.Expense.amount)
    ).filter(models.Expense.user_id == user_id).group_by(models.Expense.category).all()
    
    breakdown = {category: amount for category, amount in group_results}
    
    # Ensure all defined categories exist in the breakdown dictionary
    for cat in schemas.ExpenseCategory:
        if cat.value not in breakdown:
            breakdown[cat.value] = 0.0
            
    return {
        "total_spending": total,
        "transaction_count": count,
        "category_breakdown": breakdown
    }

