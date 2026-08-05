from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from backend.database import Base
import datetime

class User(Base):
    """
    SQLAlchemy model representing the 'users' database table.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    expenses = relationship("Expense", back_populates="owner", cascade="all, delete-orphan")

class UserSession(Base):
    """
    SQLAlchemy model representing the 'user_sessions' database table.
    """
    __tablename__ = "user_sessions"

    token = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)

class Expense(Base):
    """
    SQLAlchemy model representing the 'expenses' database table.
    """
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False, index=True)
    date = Column(Date, nullable=False)
    notes = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)

    owner = relationship("User", back_populates="expenses")

class Budget(Base):
    """
    SQLAlchemy model representing the monthly budget threshold setting.
    """
    __tablename__ = "budget"

    id = Column(Integer, primary_key=True, index=True)
    monthly_limit = Column(Float, nullable=False, default=30000.0)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
