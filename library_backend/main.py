import os
from pathlib import Path
from fastapi import FastAPI, APIRouter, Request, status, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
 
# --- Import Database & Models ---
from database import engine, Base, get_db
from models import user_model, permission_model, library_management_models

# --- Import Controllers ---
from controllers import (
    auth_controller,
    google_auth_controller,  # ✅ ADD: Google Login Controller

    user_controller,       # Admin User Management
    role_controller,       # ✅ NEW: Role Management
    profile_controller,    # ✅ NEW: Logged-in User Profile
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
    book_read_controller,       # ✅ Naya (Public/View)
    book_management_controller,
    password_controller,  # ✅ NEW: Password Management (Forgot/Reset
    post_controller,
    donation_controller
)

# --- Create Database Tables ---
# This ensures all tables exist before the app starts
print("Checking and creating database tables...")
Base.metadata.create_all(bind=engine)
print("Database tables verified.")

# --- Initialize FastAPI App ---
app = FastAPI(
    title="BookNest Library API",
    version="6.1.0",
    description="Full-featured Library API with Dynamic Permissions & Role Management.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# --- CORS Middleware ---
# Defines who can access your API
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(donation_controller.router)
# --- STATIC FILES MOUNTING ---
static_path = Path("static")
static_path.mkdir(parents=True, exist_ok=True)

# ✅ define uploads_path properly
uploads_path = static_path / "uploads"
uploads_path.mkdir(parents=True, exist_ok=True)

# ✅ NEW: posts folder (for Markaz posts uploads)
(uploads_path / "posts").mkdir(parents=True, exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")
# --- Custom Exception Handler ---
# Converts validation errors into readable JSON responses
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_details = []
    try:
        for error in exc.errors():
            input_repr = error.get("input")
            if isinstance(input_repr, bytes):
                input_repr = f"<bytes data, length {len(input_repr)}>"
            elif input_repr is not None and not isinstance(input_repr, (str, int, float, bool, list, dict)):
                input_repr = repr(input_repr)

            error_details.append({
                "loc": error.get("loc"),
                "msg": error.get("msg"),
                "type": error.get("type"),
                "input_preview": str(input_repr)[:200]
            })

        print(f"--- Validation Error --- \n{error_details}\n--- End Validation Error ---")

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=jsonable_encoder({"detail": error_details}),
        )
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error during validation."}
        )

# ==========================================
# ROUTER REGISTRATION
# ==========================================

# Create a main API router with prefix "/api"
api_router = APIRouter(prefix="/api")

# 1. Authentication
api_router.include_router(auth_controller.router, tags=["Authentication"])

# ✅ Google Authentication
# NOTE: google_auth_controller me route "/auth/google" hona chahiye
# Final endpoint: POST /api/auth/google
api_router.include_router(google_auth_controller.router, tags=["Google Auth"])

# 2. Identity Management (Refactored)
# ✅ Profile: For logged-in users (My Profile, Change Password)
api_router.include_router(profile_controller.router, prefix="/profile", tags=["Profile"])
# ✅ Users: For Admin to manage other users
api_router.include_router(user_controller.router, prefix="/users", tags=["Users"])
# ✅ Roles: For Admin to manage Roles
api_router.include_router(role_controller.router, prefix="/roles", tags=["Roles"])
# ✅ Permissions: For Admin to view/assign permissions
api_router.include_router(permission_controller.router, prefix="/permissions", tags=["Permissions"])

# 3. Library Content Management
api_router.include_router(category_controller.router, prefix="/categories", tags=["Categories"])
api_router.include_router(subcategory_controller.router, prefix="/subcategories", tags=["Subcategories"])
api_router.include_router(language_controller.router, prefix="/languages", tags=["Languages"])
api_router.include_router(location_controller.router, prefix="/locations", tags=["Locations"])
api_router.include_router(book_copy_controller.router, prefix="/copies", tags=["Copies"])
api_router.include_router(upload_controller.router, prefix="/upload", tags=["Uploads"])

# 4. Operations & Circulation
api_router.include_router(issue_controller.router, prefix="/issues", tags=["Issues"])
api_router.include_router(request_controller.router, prefix="/requests", tags=["Admin Requests"])
api_router.include_router(request_user_controller.router, prefix="/restricted-requests", tags=["User Requests"])

# 5. Security & Logs
api_router.include_router(book_permission_controller.router, prefix="/book-permissions", tags=["Book Permissions"])
api_router.include_router(digital_access_controller.router, prefix="/digital-access", tags=["Digital Access"])
api_router.include_router(log_controller.router, prefix="/logs", tags=["Logs"])

# 6. Public Actions (No Auth Required)
api_router.include_router(public_user_controller.router, prefix="/public", tags=["Public Actions"])
api_router.include_router(book_read_controller.router, prefix="/books", tags=["Books (Read)"])
api_router.include_router(book_management_controller.router, prefix="/books", tags=["Books (Manage)"])
api_router.include_router(post_controller.router, prefix="/posts", tags=["Markaz News"])
# Add the main API router to the App
app.include_router(api_router)
app.include_router(password_controller.router, prefix="/api/auth", tags=["Password Reset"])
app.include_router(profile_controller.router, prefix="/api/profile", tags=["Profile"])
# ==========================================
# UTILITY & SETUP ENDPOINTS
# ==========================================

# --- BRAHMASTRA ROUTE (Cleanup Issues) ---
@app.get("/api/nuke-issues", tags=["Debug"])
def nuke_issues(db: Session = Depends(get_db)):
    try:
        # Import dynamically to avoid circular issues during startup if tables are broken
        from models.library_management_models import IssuedBook
        deleted_count = db.query(IssuedBook).delete()
        db.commit()
        return {"message": f"Successfully deleted {deleted_count} corrupt issue records. Dashboard should work now."}
    except Exception as e:
        db.rollback()
        return {"message": f"Error deleting issues: {str(e)}"}

# --- SETUP PERMISSIONS ROUTE ---
@app.get("/api/setup-permissions", tags=["Setup"])
def setup_default_permissions(db: Session = Depends(get_db)):
    """
    Advanced setup to populate permissions and automatically
    link them to the Super Admin role.
    """
    # 1. Grouped Permissions for better organization
    permission_groups = {
        "User Management": [
            {"name": "USER_VIEW", "description": "Can view user lists and profiles"},
            {"name": "USER_MANAGE", "description": "Can create, edit, and delete users"},
        ],
        "Library Management": [
            {"name": "BOOK_VIEW", "description": "Can view the book library"},
            {"name": "BOOK_MANAGE", "description": "Can add, edit, and delete books"},
            {"name": "BOOK_ISSUE", "description": "Can issue and return physical book copies"},
        ],
        "Security & Roles": [
            {"name": "ROLE_VIEW", "description": "Can view system roles"},
            {"name": "ROLE_MANAGE", "description": "Can create and modify roles"},
            {"name": "ROLE_PERMISSION_ASSIGN", "description": "Can assign permissions to roles"},
            {"name": "PERMISSION_VIEW", "description": "Can view all available permissions"},
        ],
        "Access Requests": [
            {"name": "REQUEST_VIEW", "description": "Can view pending digital access requests"},
            {"name": "REQUEST_MANAGE", "description": "Can approve or reject access requests"},
        ],
        "System Audit": [
            {"name": "LOGS_VIEW", "description": "Can view system audit logs and activity"},
        ]
    }

    all_perms = [p for group in permission_groups.values() for p in group]
    added_names = []
    all_db_permissions = []

    # 2. Bulk Create Permissions
    for p_data in all_perms:
        db_perm = db.query(permission_model.Permission).filter(
            permission_model.Permission.name == p_data["name"]
        ).first()

        if not db_perm:
            db_perm = permission_model.Permission(
                name=p_data["name"],
                description=p_data["description"]
            )
            db.add(db_perm)
            added_names.append(p_data["name"])

        all_db_permissions.append(db_perm)

    db.flush()

    # 3. Automatically link all permissions to 'Admin' or 'SuperAdmin' role
    admin_role = db.query(user_model.Role).filter(
        user_model.Role.name.in_(["Admin", "SuperAdmin", "Administrator"])
    ).first()

    link_message = "Admin role not found."
    if admin_role:
        # Update permissions: ensuring Admin has EVERYTHING
        current_perms = set(admin_role.permissions)
        new_perms = set(all_db_permissions)
        admin_role.permissions = list(current_perms.union(new_perms))
        link_message = f"All permissions linked to role: {admin_role.name}"

    try:
        db.commit()
        return {
            "status": "Success",
            "permissions_created": len(added_names),
            "total_permissions_in_system": len(all_db_permissions),
            "role_assignment": link_message,
            "newly_added": added_names
        }
    except Exception as e:
        db.rollback()
        return {"status": "Error", "detail": str(e)}

# --- Run Server ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
