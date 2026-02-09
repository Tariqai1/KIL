import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# ==============================================================================
# 1. ENVIRONMENT CONFIGURATION
# ==============================================================================

# 🟢 LOCAL (Computer): Ye line local computer par '.env' file padhegi.
# 🔴 PRODUCTION (Render): Render par ye file nahi hoti, wo 'Environment Variables' use karega.
load_dotenv()

# ==============================================================================
# 2. DATABASE URL SELECTION (UPDATED)
# ==============================================================================

# 🔹 Option A: Automatic (Best Practice)
# Ye system se URL uthayega. 
# -> Local par: .env file se "localhost" uthayega.
# -> Render par: Dashboard se "supabase" wala link uthayega.
DATABASE_URL = os.getenv("DATABASE_URL")

# 🔹 Option B: Manual Local Override (COMMENTED OUT AS REQUESTED)
# Agar aapko zabardasti Local chalana ho, toh niche wali line uncomment karein.
# DATABASE_URL = "postgresql://postgres:password@localhost:5432/library_db"

# ==============================================================================
# 3. ERROR HANDLING & FIXES
# ==============================================================================

if not DATABASE_URL:
    raise ValueError("❌ Error: DATABASE_URL not found. Please add it to Render Environment Variables.")

# 🔧 FIX: Heroku/Render kabhi-kabhi 'postgres://' dete hain, par SQLAlchemy ko 'postgresql://' chahiye.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# ==============================================================================
# 4. ENGINE CREATION (PRODUCTION OPTIMIZED)
# ==============================================================================

connect_args = {}

# 🟢 Agar URL mein 'localhost' ya '127.0.0.1' nahi hai, toh hum maan lenge ye Cloud/Supabase hai.
if "localhost" not in DATABASE_URL and "127.0.0.1" not in DATABASE_URL:
    print("🌍 Detecting Cloud Database (Supabase/Render)... Enabling SSL.")
    # Supabase ko secure connection (SSL) chahiye hota hai
    connect_args = {"sslmode": "require"}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,  # SSL settings
    pool_pre_ping=True,         # ✅ Auto-reconnect if database connection drops
    pool_size=10,               # ✅ Handle more concurrent users
    max_overflow=20
)

# ==============================================================================
# 5. SESSION & BASE SETUP
# ==============================================================================

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency Injection
def get_db():
    """
    Creates a new database session for each request 
    and closes it automatically afterwards.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
