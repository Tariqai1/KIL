from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

# --- Imports ---
from models import user_model
from schemas import user_schema
from auth import get_db, require_permission, get_password_hash, get_current_user
from utils import create_log

router = APIRouter()

# ==================================
# USER MANAGEMENT ENDPOINTS
# ==================================

# --- CREATE USER (Admin Only) ---
@router.post("/", response_model=user_schema.User, status_code=status.HTTP_201_CREATED)
def create_user(
    user: user_schema.UserCreate,
    db: Session = Depends(get_db),
    # 🔒 Strict: Sirf User Manager hi naya user bana sake
    current_user: user_model.User = Depends(require_permission("USER_MANAGE"))
):
    """
    Creates a new user account.
    Checks for duplicate Email/Username and ensures Role exists.
    """
    # 0. Validate Password Length (Bcrypt limitation fix)
    if len(user.password.encode('utf-8')) > 72:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be less than 72 bytes.")

    # 1. Check for Duplicates (Email)
    if db.query(user_model.User).filter(
        user_model.User.email == user.email, 
        user_model.User.deleted_at.is_(None)
    ).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")
    
    # 2. Check for Duplicates (Username)
    if db.query(user_model.User).filter(
        user_model.User.username == user.username, 
        user_model.User.deleted_at.is_(None)
    ).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username is already taken")

    # 3. Check Role Existence
    if user.role_id:
        if not db.query(user_model.Role).filter(user_model.Role.id == user.role_id).first():
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Role with ID {user.role_id} not found.")
    else:
        # Default to 'Member' if no role provided
        member_role = db.query(user_model.Role).filter(user_model.Role.name == "Member").first()
        if member_role:
            user.role_id = member_role.id
        else:
             # Fallback if even Member role doesn't exist (edge case)
             raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Default 'Member' role not found. Please contact admin.")

    # 4. Create User
    try:
        hashed_password = get_password_hash(user.password)
    except ValueError as e:
        # Catch specific bcrypt errors
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    new_user_data = user.model_dump(exclude={"password"})
    
    new_user = user_model.User(
        **new_user_data,
        password_hash=hashed_password,
        status="Active",
        date_joined=datetime.utcnow()
    )
    
    db.add(new_user)
    db.flush() # ID generate karne ke liye

    # 5. Log Action
    create_log(
        db=db, user=current_user, 
        action_type="USER_CREATED", 
        description=f"User '{user.username}' created by Admin.", 
        target_type="User", target_id=new_user.id
    )
    
    db.commit()
    
    # Return with Role loaded
    return db.query(user_model.User).options(
        joinedload(user_model.User.role)
    ).filter(user_model.User.id == new_user.id).first()


# --- READ ALL USERS (Dropdowns & Lists) ---
@router.get("/", response_model=List[user_schema.User])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    # ✅ FIX: 'BOOK_ISSUE' allow kiya taake Issuer User select kar sake
    current_user: user_model.User = Depends(require_permission("BOOK_ISSUE"))
):
    """
    Fetches a list of all active users.
    Allowed for Book Issuers (to select client) and Admins.
    """
    return db.query(user_model.User).options(
        joinedload(user_model.User.role)
    ).filter(
        user_model.User.deleted_at.is_(None)
    ).order_by(user_model.User.id.desc()).offset(skip).limit(limit).all()


# --- UPDATE USER (Admin Only) ---
@router.put("/{user_id}/", response_model=user_schema.User)
def update_user(
    user_id: int,
    user_update: user_schema.UserUpdate,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(require_permission("USER_MANAGE"))
):
    """
    Updates a user's details.
    Includes safety checks for Super Admin.
    """
    db_user = db.query(user_model.User).filter(
        user_model.User.id == user_id, 
        user_model.User.deleted_at.is_(None)
    ).first()
    
    if db_user is None: 
        raise HTTPException(status_code=404, detail="User not found")
    
    # Safety Checks
    is_self_update = (db_user.id == current_user.id)
    is_super_admin_target = (db_user.username.lower() in ["admin", "superadmin"])

    update_data = user_update.model_dump(exclude_unset=True)
    updated_fields = []

    # ========================================================
    # ✅ FIX: Duplicate Checks (Exclude current user ID)
    # ========================================================
    
    # Check Email Duplicate (Only if email is being updated)
    if "email" in update_data and update_data["email"] != db_user.email:
        if db.query(user_model.User).filter(
            user_model.User.email == update_data["email"],
            user_model.User.id != user_id,  # ✅ Exclude self
            user_model.User.deleted_at.is_(None)
        ).first():
            raise HTTPException(status_code=409, detail="Email is already registered")
        db_user.email = update_data["email"]
        updated_fields.append("email")

    # Check Username Duplicate (Only if username is being updated)
    if "username" in update_data and update_data["username"] != db_user.username:
        if db.query(user_model.User).filter(
            user_model.User.username == update_data["username"],
            user_model.User.id != user_id, # ✅ Exclude self
            user_model.User.deleted_at.is_(None)
        ).first():
            raise HTTPException(status_code=409, detail="Username is already taken")
        db_user.username = update_data["username"]
        updated_fields.append("username")

    # Role Update Logic
    if "role_id" in update_data and update_data["role_id"] != db_user.role_id:
        if is_self_update: 
            raise HTTPException(status_code=400, detail="Safety Lock: You cannot change your own role.")
        if is_super_admin_target: 
            raise HTTPException(status_code=400, detail="Safety Lock: Cannot change the Super Admin's role.")
        
        role = db.query(user_model.Role).filter(user_model.Role.id == update_data["role_id"]).first()
        if not role:
             raise HTTPException(status_code=404, detail="Role not found.")
        
        db_user.role_id = update_data["role_id"]
        updated_fields.append(f"role to '{role.name}'")

    # Status Update Logic
    if "status" in update_data and update_data["status"] != db_user.status:
        if is_self_update: 
            raise HTTPException(status_code=400, detail="Safety Lock: You cannot change your own status.")
        if is_super_admin_target: 
             raise HTTPException(status_code=400, detail="Safety Lock: Super Admin must remain Active.")

        db_user.status = update_data["status"]
        updated_fields.append(f"status to '{db_user.status}'")

    # Full Name Update
    if "full_name" in update_data and update_data["full_name"] != db_user.full_name:
        db_user.full_name = update_data["full_name"]
        updated_fields.append("full name")

    # Password Update (Only if provided)
    if "password" in update_data and update_data["password"]:
        # Validate password length
        if len(update_data["password"].encode('utf-8')) > 72:
             raise HTTPException(status_code=400, detail="Password must be less than 72 bytes.")
        
        try:
            db_user.password_hash = get_password_hash(update_data["password"])
            updated_fields.append("password")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    if updated_fields:
        log_message = f"User '{db_user.username}' updated: {', '.join(updated_fields)}."
        create_log(
            db=db, user=current_user, 
            action_type="USER_UPDATED", 
            description=log_message, 
            target_type="User", target_id=user_id
        )
        db.commit()
        db.refresh(db_user)
    
    # Reload user for response
    return db.query(user_model.User).options(
        joinedload(user_model.User.role)
    ).filter(user_model.User.id == user_id).first()


# --- DELETE USER (Admin Only) ---
@router.delete("/{user_id}/", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(require_permission("USER_MANAGE"))
):
    """
    Soft deletes a user. 
    Prevents deleting Self or Super Admin.
    """
    db_user = db.query(user_model.User).filter(
        user_model.User.id == user_id, 
        user_model.User.deleted_at.is_(None)
    ).first()
    
    if db_user is None: 
        raise HTTPException(status_code=404, detail="User not found")
    
    # Safety Locks
    if db_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account.")
    
    if db_user.username.lower() in ["admin", "superadmin"]:
         raise HTTPException(status_code=400, detail="System Super Admin cannot be deleted.")

    # Soft Delete
    db_user.deleted_at = datetime.utcnow()
    db_user.status = "Deleted"
    
    create_log(
        db=db, user=current_user, 
        action_type="USER_DELETED", 
        description=f"User '{db_user.username}' (ID: {user_id}) soft-deleted.", 
        target_type="User", target_id=user_id
    )
    
    db.commit()
    return None