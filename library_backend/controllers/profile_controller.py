from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

# --- Imports ---
# Hum models ko generic import kar rahe hain taake circular dependency na ho
from models import user_model 
# Note: Agar aapke pass 'library_management_models' nahi hai to isay 'issue_model' se replace karein
# Lekin kyunki aapne snippet me diya tha, main isay rakh raha hun.
try:
    from models import library_management_models
except ImportError:
    # Fallback: Agar file ka naam alag ho (Jese models.issue_model)
    from models import issue_model as library_management_models

from schemas import user_schema, issue_schema
from auth import get_db, get_current_user, verify_password, get_password_hash
from utils import create_log

router = APIRouter()

# ==================================
# LOGGED-IN USER PROFILE ENDPOINTS
# ==================================

@router.get("/", response_model=user_schema.UserResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """
    Fetches the profile of the currently logged-in user.
    ✅ FIXED: Forces loading of Role AND Permissions from Database.
    """
    
    # 👇 MAGIC FIX: Hum DB se user ko dobara load kar rahe hain
    # taki hum 'role.permissions' ko zabardasti (Eager Load) load kar sakein.
    # Ye step bohot zaroori hai taake "Detached Instance" error na aaye.
    db_user = db.query(user_model.User).options(
        joinedload(user_model.User.role)
        .joinedload(user_model.Role.permissions) 
    ).filter(
        user_model.User.id == current_user.id
    ).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # 1. Permission List Generate Karein (Safe Way)
    permissions_list = []
    
    if db_user.role:
        # Super Admin ko sab kuch allow karo
        if db_user.role.name.lower() in ["admin", "superadmin", "administrator"]:
             # Frontend ko batane ke liye hum 'ALL_ACCESS' bhej sakte hain ya saari perms
             permissions_list.append("ALL_ACCESS")

        # Extract Permissions safely
        try:
            if db_user.role.permissions:
                for perm in db_user.role.permissions:
                    # Model ke hisaab se 'name' ya 'code' fetch karein
                    if hasattr(perm, 'code') and perm.code:
                        permissions_list.append(perm.code)
                    elif hasattr(perm, 'name') and perm.name: 
                        permissions_list.append(perm.name)
        except Exception as e:
            print(f"⚠️ Error loading permissions: {e}")

    # 2. Permissions ko response object mein daalein
    # Ye temporary attribute hai jo Schema me jaayega (DB me save nahi hoga)
    db_user.permissions = permissions_list
    
    return db_user


@router.put("/", response_model=user_schema.UserResponse)
def update_my_profile(
    user_update: user_schema.UserMeUpdate,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """ Updates the user's own profile (Full Name only). """
    
    update_data = user_update.model_dump(exclude_unset=True)
    has_changes = False
    
    if "full_name" in update_data and update_data["full_name"] != current_user.full_name:
        old_name = current_user.full_name
        current_user.full_name = update_data["full_name"]
        has_changes = True
        
        # Log create karein (Safe check ke sath)
        try:
            create_log(
                db=db, user=current_user,
                action_type="PROFILE_UPDATED",
                description=f"User updated their name from '{old_name}' to '{current_user.full_name}'.",
                target_type="User", target_id=current_user.id
            )
        except Exception as log_error:
            print(f"Log Error (Ignored): {log_error}")

    if has_changes:
        db.commit()
        db.refresh(current_user)
    
    # Response fail na ho isliye empty list set karein (Safe Side)
    # Kyunki Schema "permissions" expect kar raha hai
    current_user.permissions = [] 
    
    return current_user


@router.post("/change-password/", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    password_data: user_schema.ChangePasswordSchema,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """ Changes the current user's password. """
    
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password."
        )
    
    current_user.password_hash = get_password_hash(password_data.new_password)
    
    try:
        create_log(
            db=db, user=current_user,
            action_type="PASSWORD_CHANGED",
            description="User changed their password.",
            target_type="User", target_id=current_user.id
        )
    except Exception:
        pass
    
    db.commit()
    return None


@router.get("/issued-books/", response_model=List[issue_schema.Issue])
def get_my_issued_books(
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """ Fetches books issued to the current user. """
    
    # Hum check kar rahe hain ke 'IssuedBook' model available hai ya nahi
    # Agar aapke model ka naam 'Issue' hai to neeche 'IssuedBook' ko 'Issue' kar dein
    TargetModel = getattr(library_management_models, "IssuedBook", None) or getattr(library_management_models, "Issue", None)
    
    if not TargetModel:
        raise HTTPException(status_code=500, detail="Server Configuration Error: Issue Model not found")

    issues = db.query(TargetModel).options( 
        joinedload(TargetModel.book_copy)
            .joinedload(library_management_models.BookCopy.book)
    ).filter(
        # Yahan hum client_id check kar rahe hain
        TargetModel.client_id == current_user.id
    ).order_by(
        TargetModel.issue_date.desc()
    ).all()
    
    return issues