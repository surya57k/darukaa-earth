import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
database_url = env.get("DATABASE_URL")

database_url = os.getenv("DATABASE_URL")

engine = create_engine(database_url, pool_pre_ping=True)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()