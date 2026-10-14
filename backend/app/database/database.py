import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

from app.config import DATABASE_URL, TEST_DATABASE_URL

# Engine configuration with connection pooling and health checks
engine_kwargs = {
    "echo": False,
    "pool_pre_ping": True,
}

if DATABASE_URL.startswith("postgresql"):
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
    })
elif DATABASE_URL.startswith("sqlite"):
    engine_kwargs.update({
        "connect_args": {"check_same_thread": False}
    })

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_test_engine():
    """Create dedicated test database engine for testing"""
    return create_engine(TEST_DATABASE_URL, pool_pre_ping=True)


def init_db():
    """Create all tables defined in Base metadata"""
    import app.database.models  # noqa: F401
    Base.metadata.create_all(bind=engine)
