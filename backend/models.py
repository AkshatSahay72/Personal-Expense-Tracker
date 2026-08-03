from sqlalchemy import Column, Integer, String, Float, Date
from backend.database import Base

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
