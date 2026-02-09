import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# ✅ Load environment variables (Local development ke liye)
load_dotenv()

# ✅ Get DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL environment variable not set. Please set it in .env or Render Dashboard.")

# 🔧 FIX 1: SQLAlchemy ko 'postgres://' samajh nahi aata, use 'postgresql://' chahiye
# (Heroku/Render kabhi-kabhi purana format dete hain)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 🔧 FIX 2: Production Settings (SSL & Connection Pooling)
# Supabase/Cloud DBs ko secure connection (SSL) chahiye hota hai.
connect_args = {"sslmode": "require"}

# Engine Creation with Optimizations
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,  # ✅ Bahut Zaruri: Broken connections ko automatically detect karke fix karega
    pool_size=10,        # ✅ Ek time par kitne connections open rahenge (Default 5 kam pad sakta hai)
    max_overflow=20,     # ✅ Agar load badhe toh extra connections allow karega
)

# ✅ Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ✅ Base class for models
Base = declarative_base()

# Dependency function to use in FastAPI
def get_db():
    """
    Provides a database session to routes.
    Closes the session automatically after request is done.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
