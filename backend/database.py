from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# SQLite database file path in the local directory
SQLALCHEMY_DATABASE_URL = "sqlite:///./expenses.db"

# Create the engine. check_same_thread=False is needed only for SQLite to allow multiple threads.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Create the session local maker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for our ORM models
Base = declarative_base()

def get_db():
    """
    Dependency generator for creating database sessions.
    Yields a database session to the request handler and closes it when the request is done.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
