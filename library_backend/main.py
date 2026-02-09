import os
import sys
import logging
import bcrypt  # ✅ Essential for the patch
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, Request, status, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from sqlalchemy import text

# =====================================================
# 🛠️ CRITICAL FIX: Passlib & Bcrypt Compatibility Patch
# =====================================================
# This must run before any other logic to prevent login errors on Python 3.12+
if not hasattr(bcrypt, '__about__'):
    try:
        class About:
            __version__ = bcrypt.__version__
        bcrypt.__about__ = About()
    except Exception:
        pass

# =====================================================
# 1. SETUP PATHS & ENV
# =====================================================
BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR.parent / ".env"
load_dotenv(ENV_PATH)

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# =====================================================
# 2. DATABASE IMPORTS
# =====================================================
from database import engine, Base, get_db
from models import user_model, permission_model, library_management_models

# =====================================================
# 3. CONTROLLER IMPORTS
# =====================================================
from controllers import (
    auth_controller,
    google_auth_controller,
    user_controller,
    role_controller,
    profile_controller,
    permission_controller,
    category_controller,
    subcategory_controller,
    language_controller,
    book_copy_controller,
    issue_controller,
    digital_access_controller,
    location_controller,
    log_controller,
    book_permission_controller,
    upload_controller,
    request_user_controller,
    public_user_controller,
    request_controller,
    book_read_controller,
    book_management_controller,
    password_controller,
    post_controller,
    donation_controller
)

# =====================================================
# 4. LIFESPAN MANAGER
# =====================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application Startup & Shutdown Logic.
    Ensures Database Tables exist before server starts.
    """
    logger.info("🔄 Starting BookNest API...")
    
    # Database Check & Table Creation
    try:
        Base.metadata.create_all(bind=engine)
        
        # Verify Connection
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        logger.info("✅ Database Tables Verified & Connected.")
    except Exception as e:
        logger.critical(f"❌ DATABASE ERROR: {str(e)}")
    
    yield  # Server runs here
    
    logger.info("🛑 Shutting down BookNest API...")

# =====================================================
# 5. INITIALIZE FASTAPI
# =====================================================
app = FastAPI(
    title="BookNest Library API",
    version="6.5.0",
    description="Full-featured Library API (Optimized Router Order)",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# =====================================================
# 6. STATIC FILES SETUP
# =====================================================
static_dir = BASE_DIR / "static"
uploads_dir = static_dir / "uploads"
posts_dir = uploads_dir / "posts"
images_dir = static_dir / "images" # ✅ Added images folder for Logo

# Create directories if they don't exist
for folder in [static_dir, uploads_dir, posts_dir, images_dir]:
    folder.mkdir(parents=True, exist_ok=True)

app.mount("/static", StaticFiles(directory=static_dir), name="static")

# =====================================================
# 7. CORS MIDDLEWARE
# =====================================================
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # ✅ YOUR VERCEL APP URL
    "https://pkil-two.vercel.app",
    "https://pkil-two.vercel.app/"
]

# Add Production URL from Environment Variable
env_frontend_url = os.getenv("FRONTEND_URL")
if env_frontend_url:
    origins.append(env_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# 8. EXCEPTION HANDLERS
# =====================================================
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_details = []
    try:
        for error in exc.errors():
            input_repr = error.get("input")
            if isinstance(input_repr, bytes):
                input_repr = f"<bytes, len={len(input_repr)}>"
            elif input_repr and not isinstance(input_repr, (str, int, float, bool, list, dict)):
                input_repr = str(input_repr)

            error_details.append({
                "loc": error.get("loc"),
                "msg": error.get("msg"),
                "type": error.get("type"),
                "input_preview": str(input_repr)[:100] if input_repr else "N/A"
            })
        
        logger.warning(f"⚠️ Validation Error: {error_details}")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=jsonable_encoder({"detail": error_details, "message": "Validation Failed"}),
        )
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error during validation."}
        )

# =====================================================
# 9. ROUTER REGISTRATION
# =====================================================
api_router = APIRouter(prefix="/api")

# --- Authentication ---
api_router.include_router(auth_controller.router, tags=["Authentication"])
api_router.include_router(google_auth_controller.router, tags=["Google Auth"])
api_router.include_router(password_controller.router, prefix="/auth", tags=["Password Reset"])

# --- Users & Roles ---
api_router.include_router(profile_controller.router, prefix="/profile", tags=["Profile"])
api_router.include_router(user_controller.router, prefix="/users", tags=["Users"])
api_router.include_router(role_controller.router, prefix="/roles", tags=["Roles"])
api_router.include_router(permission_controller.router, prefix="/permissions", tags=["Permissions"])

# --- Library Content ---
api_router.include_router(category_controller.router, prefix="/categories", tags=["Categories"])
api_router.include_router(subcategory_controller.router, prefix="/subcategories", tags=["Subcategories"])
api_router.include_router(language_controller.router, prefix="/languages", tags=["Languages"])
api_router.include_router(location_controller.router, prefix="/locations", tags=["Locations"])
api_router.include_router(book_copy_controller.router, prefix="/copies", tags=["Copies"])
api_router.include_router(upload_controller.router, prefix="/upload", tags=["Uploads"])

# --- Operations ---
api_router.include_router(issue_controller.router, prefix="/issues", tags=["Issues"])
api_router.include_router(request_controller.router, prefix="/requests", tags=["Requests (Admin)"])
api_router.include_router(request_user_controller.router, prefix="/restricted-requests", tags=["Requests (User)"])

# --- Security & Logs ---
api_router.include_router(book_permission_controller.router, prefix="/book-permissions", tags=["Book Permissions"])
api_router.include_router(digital_access_controller.router, prefix="/digital-access", tags=["Digital Access"])
api_router.include_router(log_controller.router, prefix="/logs", tags=["Logs"])

# --- Public & Extra ---
api_router.include_router(public_user_controller.router, prefix="/public", tags=["Public Actions"])

# ✅ FIX: Static routes (Manage) MUST come before Dynamic routes (Read by ID)
api_router.include_router(book_management_controller.router, prefix="/books", tags=["Books (Manage)"])
api_router.include_router(book_read_controller.router, prefix="/books", tags=["Books (Read)"])

api_router.include_router(post_controller.router, prefix="/posts", tags=["Markaz News"])

# ✅ FIX: Added prefix so route becomes /api/donation
api_router.include_router(donation_controller.router, prefix="/donation", tags=["Donation"])

# Add Main Router to App
app.include_router(api_router)

# =====================================================
# 10. UTILITY ENDPOINTS
# =====================================================

@app.get("/", tags=["System"])
def root():
    return {"message": "Welcome to BookNest Library API", "status": "running"}

@app.get("/api/health", tags=["System"])
def health_check():
    return {"status": "ok", "version": app.version}

@app.get("/api/nuke-issues", tags=["Debug"])
def nuke_issues(db: Session = Depends(get_db)):
    """Deletes all issued books (Emergency cleanup)"""
    try:
        from models.library_management_models import IssuedBook
        deleted_count = db.query(IssuedBook).delete()
        db.commit()
        return {"message": f"Successfully deleted {deleted_count} corrupt issue records."}
    except Exception as e:
        db.rollback()
        return {"message": f"Error deleting issues: {str(e)}"}

@app.get("/api/setup-permissions", tags=["Setup"])
def setup_default_permissions(db: Session = Depends(get_db)):
    """Creates default permissions."""
    permission_groups = {
        "User Management": ["USER_VIEW", "USER_MANAGE"],
        "Library Management": ["BOOK_VIEW", "BOOK_MANAGE", "BOOK_ISSUE"],
        "Security & Roles": ["ROLE_VIEW", "ROLE_MANAGE", "ROLE_PERMISSION_ASSIGN", "PERMISSION_VIEW"],
        "Access Requests": ["REQUEST_VIEW", "REQUEST_MANAGE"],
        "System Audit": ["LOGS_VIEW"]
    }
    
    added = []
    all_perms = []
    
    try:
        for group, names in permission_groups.items():
            for name in names:
                desc = f"{group}: {name.replace('_', ' ').title()}"
                db_perm = db.query(permission_model.Permission).filter_by(name=name).first()
                if not db_perm:
                    db_perm = permission_model.Permission(name=name, description=desc)
                    db.add(db_perm)
                    added.append(name)
                all_perms.append(db_perm)
        db.flush()

        admin_roles = db.query(user_model.Role).filter(
            user_model.Role.name.in_([ "Admin", "SuperAdmin", "Administrator"])
        ).all()
        
        for role in admin_roles:
            current = set(role.permissions)
            new_p = set(all_perms)
            role.permissions = list(current.union(new_p))
            
        db.commit()
        return {"status": "Success", "added": len(added)}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}

# =====================================================
# 11. MAIN ENTRY POINT
# =====================================================
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = "0.0.0.0"
    logger.info(f"🚀 Server starting on http://{host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=True)
