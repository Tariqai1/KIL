import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session, joinedload
from dotenv import load_dotenv

# --- Imports ---
from models import user_model
from database import SessionLocal

# ✅ Load .env
load_dotenv()

# --- CONFIGURATION ---
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key-for-dev-only")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# Default: 30 days
try:
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 43200))
except ValueError:
    ACCESS_TOKEN_EXPIRE_MINUTES = 43200

# Password Hashing Config
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ✅ auto_error=False => allows optional auth (public endpoints can check if user exists)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token", auto_error=False)


# ==========================================================
# ✅ HELPERS
# ==========================================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a raw password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generates a bcrypt hash for a password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """
    ✅ Creates JWT token
    IMPORTANT: 'sub' (subject) must always be a string in JWT standards.
    """
    to_encode = data.copy()

    # ✅ Fix: Ensure sub is string (because User ID is int)
    if "sub" in to_encode and to_encode["sub"] is not None:
        to_encode["sub"] = str(to_encode["sub"])

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_db():
    """Database dependency."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==========================================================
# ✅ TOKEN -> USER FETCH
# ==========================================================

async def get_user_from_token(token: str, db: Session) -> Optional[user_model.User]:
    """
    ✅ Decodes token and fetches User + Role + Permissions.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")

        if sub is None:
            return None

        # ✅ Fix: Convert 'sub' (string) back to 'int' for DB query
        try:
            user_id = int(sub)
        except ValueError:
            return None

    except JWTError:
        return None

    # Fetch User with Role and Permissions loaded eagerly
    user = (
        db.query(user_model.User)
        .options(
            joinedload(user_model.User.role).joinedload(user_model.Role.permissions)
        )
        .filter(user_model.User.id == user_id)
        .first()
    )

    return user


# ==========================================================
# ✅ CURRENT USER DEPENDENCIES
# ==========================================================

async def get_current_user_optional(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[user_model.User]:
    """
    ✅ PUBLIC ACCESS: Returns user object if logged in, else None.
    Does not raise 401 error.
    """
    if not token:
        return None

    user = await get_user_from_token(token, db)
    return user


async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> user_model.User:
    """
    🔒 PRIVATE ACCESS: Returns User object.
    Raises 401 if not logged in or invalid token.
    """
    auth_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise auth_exception

    user = await get_user_from_token(token, db)

    if user is None:
        raise auth_exception

    # ✅ Active Status Check
    # Assuming 'Active' is the correct status string. Adjust if you use 'active' lowercase.
    if user.status and str(user.status).lower() != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="User account is inactive."
        )

    return user


# ==========================================================
# ✅ PERMISSION CHECKER
# ==========================================================

def require_permission(permission_code: str):
    """
    Dependency to check if the current user has a specific permission.
    """
    async def permission_checker(
        current_user: user_model.User = Depends(get_current_user),
    ):
        # 1. ✅ Admin Bypass: Super Admins get access to everything
        if current_user.role and current_user.role.name:
            role_name = current_user.role.name.lower()
            if role_name in ["admin", "superadmin", "administrator"]:
                return current_user

        # 2. ✅ Collect Permissions from DB
        user_perms = set()
        if current_user.role and current_user.role.permissions:
            for p in current_user.role.permissions:
                # Support both 'code' and 'name' fields for flexibility
                if hasattr(p, "code") and p.code:
                    user_perms.add(p.code)
                elif hasattr(p, "name") and p.name:
                    user_perms.add(p.name)

        # 3. ✅ Check if required permission exists
        if permission_code not in user_perms:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You do not have permission: {permission_code}",
            )

        return current_user

    return permission_checker
