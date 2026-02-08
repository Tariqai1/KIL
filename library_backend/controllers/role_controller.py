from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime

# --- Imports ---
from models import user_model, permission_model 
from schemas import user_schema
from auth import get_db, require_permission, get_current_user
from utils import create_log

router = APIRouter()

# ==================================
# ROLE MANAGEMENT ENDPOINTS
# ==================================

# 1. Create Role
@router.post("/", response_model=user_schema.Role, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_permission("ROLE_MANAGE"))])
def create_role(
    role: user_schema.RoleCreate, 
    db: Session = Depends(get_db), 
    current_user: user_model.User = Depends(get_current_user)
):
    existing_role = db.query(user_model.Role).filter(
        user_model.Role.name == role.name, 
        user_model.Role.deleted_at.is_(None)
    ).first()
    
    if existing_role:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Role with this name already exists")

    new_role = user_model.Role(name=role.name, description=role.description)
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    
    create_log(
        db=db, user=current_user, 
        action_type="ROLE_CREATED", 
        description=f"Role '{role.name}' created.", 
        target_type="Role", target_id=new_role.id
    )
    return new_role

# 2. Get All Roles (🔥 FIX: Permissions bhi load hongi)
@router.get("/", response_model=List[user_schema.Role], dependencies=[Depends(require_permission("ROLE_VIEW"))])
def get_roles(db: Session = Depends(get_db)):
    """Fetches a list of all active user roles with their permissions."""
    return db.query(user_model.Role).options(
        joinedload(user_model.Role.permissions) 
    ).filter(
        user_model.Role.deleted_at.is_(None)
    ).order_by(user_model.Role.name).all()

# 3. Get Role Details (🔥 FIX: Permissions bhi load hongi)
@router.get("/{role_id}/", response_model=user_schema.Role, dependencies=[Depends(require_permission("ROLE_VIEW"))])
def get_role(role_id: int, db: Session = Depends(get_db)):
    """Fetches details for a single active role by ID with permissions."""
    db_role = db.query(user_model.Role).options(
        joinedload(user_model.Role.permissions)
    ).filter(
        user_model.Role.id == role_id,
        user_model.Role.deleted_at.is_(None)
    ).first()
    
    if db_role is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    return db_role

# 4. Update Role Name/Description
@router.put("/{role_id}/", response_model=user_schema.Role, dependencies=[Depends(require_permission("ROLE_MANAGE"))])
def update_role(
    role_id: int, 
    role_update: user_schema.RoleUpdate, 
    db: Session = Depends(get_db), 
    current_user: user_model.User = Depends(get_current_user)
):
    db_role = db.query(user_model.Role).filter(
        user_model.Role.id == role_id, 
        user_model.Role.deleted_at.is_(None)
    ).first()
    
    if db_role is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")

    if db_role.name.lower() in ['admin', 'superadmin', 'member'] and role_update.name and role_update.name.lower() != db_role.name.lower():
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot rename system-critical roles.")

    update_data = role_update.model_dump(exclude_unset=True)
    
    if "name" in update_data and update_data["name"] != db_role.name:
        existing_role = db.query(user_model.Role).filter(
            user_model.Role.name == update_data["name"],
            user_model.Role.id != role_id,
            user_model.Role.deleted_at.is_(None)
        ).first()
        if existing_role:
             raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Role '{update_data['name']}' already exists")

    for key, value in update_data.items():
        setattr(db_role, key, value)

    create_log(
        db=db, user=current_user, 
        action_type="ROLE_UPDATED", 
        description=f"Role ID {role_id} updated.", 
        target_type="Role", target_id=role_id
    )
    db.commit()
    db.refresh(db_role)
    return db_role

# 5. Permission Assignment Endpoint (🔥 FIXED)
@router.put("/{role_id}/permissions", dependencies=[Depends(require_permission("ROLE_PERMISSION_ASSIGN"))])
def update_role_permissions(
    role_id: int, 
    # ✅ FIX: Use Body(embed=True) to accept JSON: { "permission_ids": [1, 2] }
    permission_ids: List[int] = Body(..., embed=True), 
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """
    Updates the permissions assigned to a specific role.
    Expects JSON body: { "permission_ids": [1, 2, 3] }
    """
    db_role = db.query(user_model.Role).filter(user_model.Role.id == role_id).first()
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Fetch permissions from DB to validate IDs
    new_permissions = db.query(permission_model.Permission).filter(
        permission_model.Permission.id.in_(permission_ids)
    ).all()

    # SQLAlchemy magic: Update the relationship (This handles add/remove automatically)
    db_role.permissions = new_permissions 
    
    create_log(
        db=db, user=current_user, 
        action_type="PERMISSIONS_UPDATED", 
        description=f"Updated permissions for Role '{db_role.name}'", 
        target_type="Role", target_id=role_id
    )

    db.commit()
    return {"message": "Permissions updated successfully", "count": len(new_permissions)}

# 6. Delete Role
@router.delete("/{role_id}/", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_permission("ROLE_MANAGE"))])
def delete_role(
    role_id: int, 
    db: Session = Depends(get_db), 
    current_user: user_model.User = Depends(get_current_user)
):
    db_role = db.query(user_model.Role).filter(
        user_model.Role.id == role_id, 
        user_model.Role.deleted_at.is_(None)
    ).first()
    
    if db_role is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")

    if db_role.name.lower() in ['admin', 'superadmin', 'member']:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete system-critical roles.")

    users_count = db.query(user_model.User).filter(
        user_model.User.role_id == role_id, 
        user_model.User.deleted_at.is_(None)
    ).count()
    
    if users_count > 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot delete role. {users_count} users are currently assigned to it.")

    db_role.deleted_at = datetime.utcnow()
    
    create_log(
        db=db, user=current_user, 
        action_type="ROLE_DELETED", 
        description=f"Role '{db_role.name}' soft-deleted.", 
        target_type="Role", target_id=role_id
    )
    db.commit()
    return None