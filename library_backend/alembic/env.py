# Postgres sql 
# file: alembic/env.py
import os
import sys
from logging.config import fileConfig

# --- YEH ZAROORI HAI ---
# .env file ko load karne ke liye
from dotenv import load_dotenv
load_dotenv()
# --- KHATAM ---

from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

# Isse Alembic ko project ka root folder milta hai
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), '..')))

# Apne project ke Base object ko import karein
from database import Base

# Apne sabhi models ko yahan import karein
from models.user_model import User, Role
from models.book_model import Book, Category, Subcategory
from models.language_model import Language
from models.library_management_models import Location, BookCopy, IssuedBook, DigitalAccess
from models.permission_model import Permission
from models.request_model import UploadRequest
from models.log_model import Log
from models.book_permission_model import BookPermission

# Alembic config object
config = context.config

# Logging setup
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Target metadata for autogeneration
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    # .env se URL load karein
    url = os.getenv("DATABASE_URL")
    if not url:
        raise Exception("DATABASE_URL not found in environment. Check your .env file.")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    configuration = config.get_section(config.config_ini_section)
    
    # .env se URL load karein
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise Exception("DATABASE_URL not found in environment. Check your .env file.")
    
    # Alembic config ko seedha URL dein
    configuration["sqlalchemy.url"] = db_url

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


# Migration mode check
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()