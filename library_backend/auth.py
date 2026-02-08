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

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ✅ auto_error=False => optional auth supported
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token", auto_error=False)


# ==========================================================
# ✅ HELPERS
# ==========================================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """
    ✅ Creates JWT token
    IMPORTANT: sub should always be string
    """
    to_encode = data.copy()

    # ✅ Always keep sub as string
    if "sub" in to_encode and to_encode["sub"] is not None:
        to_encode["sub"] = str(to_encode["sub"])

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==========================================================
# ✅ TOKEN -> USER FETCH (FIXED)
# ==========================================================

async def get_user_from_token(token: str, db: Session) -> Optional[user_model.User]:
    """
    ✅ Decodes token and fetches User + Role + Permissions.
    FIX: sub is user_id (example: "20"), not username
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")

        if sub is None:
            return None

        # ✅ Convert sub -> int user_id safely
        try:
            user_id = int(sub)
        except ValueError:
            return None

    except JWTError:
        return None

    user = (
        db.query(user_model.User)
        .options(
            joinedload(user_model.User.role).joinedload(user_model.Role.permissions)
        )
        .filter(user_model.User.id == user_id)  # ✅ FIXED HERE
        .first()
    )

    return user


# ==========================================================
# ✅ CURRENT USER (OPTIONAL + REQUIRED)
# ==========================================================

async def get_current_user_optional(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[user_model.User]:
    """
    ✅ PUBLIC ACCESS
    Returns user if logged in else None
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
    🔒 PRIVATE/PROTECTED ACCESS
    Returns 401 if not logged in or invalid token
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

    # ✅ Status check
    if user.status and str(user.status).lower() != "active":
        raise HTTPException(status_code=400, detail="User account is inactive.")

    return user


# ==========================================================
# ✅ PERMISSION CHECKER
# ==========================================================

def require_permission(permission_code: str):
    """
    Dependency to check user permissions.
    """

    async def permission_checker(
        current_user: user_model.User = Depends(get_current_user),
    ):
        # ✅ Admin bypass
        if current_user.role and current_user.role.name and current_user.role.name.lower() in [
            "admin", "superadmin", "administrator"
        ]:
            return current_user

        # ✅ Collect permissions
        user_perms = set()

        if current_user.role and current_user.role.permissions:
            for p in current_user.role.permissions:
                if hasattr(p, "code") and p.code:
                    user_perms.add(p.code)
                elif hasattr(p, "name") and p.name:
                    user_perms.add(p.name)

        if permission_code not in user_perms:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You do not have permission: {permission_code}",
            )

        return current_user

    return permission_checker
