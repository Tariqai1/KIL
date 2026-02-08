# file: controllers/auth_controller.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session, joinedload
from datetime import timedelta

from models import user_model
from auth import (
    verify_password,
    create_access_token,
    get_db,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from utils import create_log

router = APIRouter()


@router.post("/token", tags=["Authentication"])
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    username = (form_data.username or "").strip()
    password = form_data.password or ""

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password are required.",
        )

    # ✅ 1) Fetch User (Eager Load Role & Permissions)
    user = (
        db.query(user_model.User)
        .options(joinedload(user_model.User.role).joinedload(user_model.Role.permissions))
        .filter(user_model.User.username == username)
        .first()
    )

    # ✅ 2) Verify Credentials with Detailed Debugging
    verification_passed = False
    
    if not user:
        print(f"❌ Login Failed: User '{username}' not found in DB.")
    else:
        try:
            # Check Password
            if verify_password(password, user.password_hash):
                verification_passed = True
            else:
                print(f"❌ Login Failed: Incorrect password for '{username}'")
        except ValueError as e:
            # Ye tab aata hai jab password > 72 bytes ho ya format galat ho
            print(f"⚠️ Bcrypt ValueError for '{username}': {e}")
        except Exception as e:
            # Ye tab aata hai jab Library version galat ho (AttributeError)
            print(f"⚠️ Critical Library Error during Verify: {e}")
            print("👉 SOLUTION: Run 'pip install bcrypt==4.0.1' in terminal.")

    if not verification_passed:
        # Log Failed Attempt in DB
        try:
            create_log(
                db=db,
                user=user if user else None,
                action_type="LOGIN_FAILED",
                description=f"Failed login attempt for username: {username}",
                target_type="User",
                target_id=user.id if user else None,
            )
            db.commit()
        except Exception:
            pass

        # Return 401 to Frontend
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # ✅ 3) Account Status Check
    user_status = str(user.status).strip().lower() if user.status else "active"
    if user_status != "active":
        print(f"⛔ Login Blocked: User '{username}' is {user_status}")
        try:
            create_log(
                db=db,
                user=user,
                action_type="LOGIN_BLOCKED",
                description=f"Inactive user tried login: {user.username}",
                target_type="User",
                target_id=user.id,
            )
            db.commit()
        except Exception:
            pass

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive.",
        )

    # ✅ 4) Permissions List
    user_permissions = []
    if user.role and user.role.permissions:
        for p in user.role.permissions:
            if getattr(p, "code", None):
                user_permissions.append(p.code)
            elif getattr(p, "name", None):
                user_permissions.append(p.name)

    # ✅ 5) Create Access Token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "username": user.username,
            "role": user.role.name if user.role else "Member",
        },
        expires_delta=access_token_expires,
    )

    # ✅ 6) Log Success
    try:
        create_log(
            db=db,
            user=user,
            action_type="LOGIN_SUCCESS",
            description=f"User '{user.username}' logged in successfully.",
            target_type="User",
            target_id=user.id,
        )
        db.commit()
    except Exception:
        pass

    print(f"✅ Login Success: {user.username}")

    # ✅ 7) Return Response
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role.name if user.role else "Member",
            "permissions": user_permissions,
        },
    }