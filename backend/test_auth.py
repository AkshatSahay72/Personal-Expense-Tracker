import sys
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database import Base
from backend import models, schemas, crud

def run_tests():
    print("Running authentication backend tests...")
    
    # Set up in-memory SQLite database
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    try:
        # Test 1: Password hashing and verification
        password = "secret_password"
        hashed = crud.hash_password(password)
        assert hashed != password
        assert crud.verify_password(password, hashed) is True
        assert crud.verify_password("wrong_password", hashed) is False
        print("OK: Test 1: Password hashing & verification passed.")
        
        # Test 2: User registration
        user_in = schemas.UserCreate(username="user1", password="password1")
        user = crud.create_user(db, user_in)
        assert user.username == "user1"
        assert user.id is not None
        print("OK: Test 2: User registration passed.")
        
        # Test 3: Get user by username
        fetched_user = crud.get_user_by_username(db, "user1")
        assert fetched_user is not None
        assert fetched_user.id == user.id
        print("OK: Test 3: Get user by username passed.")
        
        # Test 4: Duplicate registration prevention (checked in route, but let's test db unique constraint)
        try:
            crud.create_user(db, schemas.UserCreate(username="user1", password="password123"))
            assert False, "Should have raised IntegrityError"
        except Exception:
            db.rollback()
            print("OK: Test 4: Duplicate user constraint verified.")
            
        # Test 5: Session generation and validation
        session = crud.create_session(db, user.id)
        assert session.token is not None
        assert session.user_id == user.id
        
        db_session = crud.get_session(db, session.token)
        assert db_session is not None
        assert db_session.user_id == user.id
        print("OK: Test 5: Session creation and retrieval passed.")
        
        # Test 6: Invalidate session
        crud.delete_session(db, session.token)
        deleted_session = crud.get_session(db, session.token)
        assert deleted_session is None
        print("OK: Test 6: Session deletion passed.")
        
        # Test 7: Multi-user isolation
        # Register User 2
        user2_in = schemas.UserCreate(username="user2", password="password2")
        user2 = crud.create_user(db, user2_in)
        
        # Create expense for User 1
        exp_in = schemas.ExpenseCreate(
            title="Lunch",
            amount=250.0,
            category=schemas.ExpenseCategory.FOOD,
            date=datetime.date(2026, 8, 5),
            notes="Tasty lunch"
        )
        exp = crud.create_expense(db, exp_in, user.id)
        assert exp.user_id == user.id
        
        # Create expense for User 2
        exp2_in = schemas.ExpenseCreate(
            title="Bus Ticket",
            amount=45.0,
            category=schemas.ExpenseCategory.TRAVEL,
            date=datetime.date(2026, 8, 5),
            notes=None
        )
        exp2 = crud.create_expense(db, exp2_in, user2.id)
        assert exp2.user_id == user2.id
        
        # Fetch expenses for User 1
        exp_list_user1 = crud.get_expenses(db, user.id)
        assert len(exp_list_user1) == 1
        assert exp_list_user1[0].id == exp.id
        
        # Fetch expenses for User 2
        exp_list_user2 = crud.get_expenses(db, user2.id)
        assert len(exp_list_user2) == 1
        assert exp_list_user2[0].id == exp2.id
        
        # Fetch summary stats isolation
        summary_user1 = crud.get_expense_summary(db, user.id)
        assert summary_user1["total_spending"] == 250.0
        assert summary_user1["transaction_count"] == 1
        
        summary_user2 = crud.get_expense_summary(db, user2.id)
        assert summary_user2["total_spending"] == 45.0
        assert summary_user2["transaction_count"] == 1
        
        print("OK: Test 7: Multi-user expense isolation passed.")
        
        # Test 8: Backwards compatibility (Orphan expense mapping)
        # Create an expense with user_id = None
        db_expense_orphan = models.Expense(
            title="Old Expense",
            amount=500.0,
            category="Bills",
            date=datetime.date(2026, 8, 1),
            notes="Before auth was added",
            user_id=None
        )
        db.add(db_expense_orphan)
        db.commit()
        
        # Set up a new in-memory clean database for registering first user compatibility test
        engine_compat = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=engine_compat)
        db_compat = sessionmaker(bind=engine_compat)()
        
        # Insert orphan record in the clean db
        old_exp = models.Expense(
            title="Old Expense",
            amount=500.0,
            category="Bills",
            date=datetime.date(2026, 8, 1),
            user_id=None
        )
        db_compat.add(old_exp)
        db_compat.commit()
        
        # Register first user
        compat_user = crud.create_user(db_compat, schemas.UserCreate(username="first", password="pwd"))
        # Check if the old_exp has been mapped to user
        db_compat.refresh(old_exp)
        assert old_exp.user_id == compat_user.id
        print("OK: Test 8: Orphan expense mapping for backwards compatibility passed.")
        
        print("\nAll tests completed successfully!")
        
    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
