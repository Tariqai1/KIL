from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

# Imports (Ensure these match your project structure)
from models import user_model, permission_model 
from schemas import permission_schema 
from auth import require_permission, get_db
from utils import create_log

router = APIRouter()

# ==========================================
# 1. PERMISSIONS CRUD
# ==========================================

@router.get(
    "/permissions", 
    response_model=List[permission_schema.Permission],
    # dependencies=[Depends(require_permission("PERMISSION_VIEW"))]
    
)
def get_all_permissions(db: Session = Depends(get_db)):
    """Fetch all permissions."""
    return db.query(permission_model.Permission).order_by(permission_model.Permission.name).all()

@router.post(
    "/permissions", 
    response_model=permission_schema.Permission,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("PERMISSION_MANAGE"))]
)
def create_permission(
    permission: permission_schema.PermissionCreate,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(require_permission("PERMISSION_MANAGE"))
):
    """Create a new permission."""
    existing = db.query(permission_model.Permission).filter(
        permission_model.Permission.name == permission.name
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Permission '{permission.name}' already exists")

    new_perm = permission_model.Permission(**permission.model_dump())
    db.add(new_perm)
    db.commit()
    db.refresh(new_perm)
    
    create_log(db, current_user, "PERMISSION_CREATED", f"Created: {new_perm.name}", "Permission", new_perm.id)
    return new_perm

# ==========================================
# 2. ROLES CRUD (ADDED MISSING FUNCTIONS)
# ==========================================

@router.get(
    "/roles", 
    response_model=List[permission_schema.RoleWithPermissions],
    dependencies=[Depends(require_permission("ROLE_VIEW"))]
)
def get_all_roles(db: Session = Depends(get_db)):
    """Fetch all roles."""
    return db.query(user_model.Role).options(
        joinedload(user_model.Role.permissions)
    ).filter(user_model.Role.deleted_at.is_(None)).all()

@router.get(
    "/roles/{role_id}", 
    response_model=permission_schema.RoleWithPermissions,
    dependencies=[Depends(require_permission("ROLE_VIEW"))]
)
def get_role_details(role_id: int, db: Session = Depends(get_db)):
    """Get single role details."""
    role = db.query(user_model.Role).options(
        joinedload(user_model.Role.permissions)
    ).filter(user_model.Role.id == role_id, user_model.Role.deleted_at.is_(None)).first()
    
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role

# ✅ NEW: Create Role Endpoint
@router.post(
    "/roles", 
    response_model=permission_schema.RoleWithPermissions,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("ROLE_MANAGE"))]
)
def create_role(
    role_data: permission_schema.RoleCreate, # Ensure you have RoleCreate schema
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(require_permission("ROLE_MANAGE"))
):
    """Create a new role."""
    existing = db.query(user_model.Role).filter(user_model.Role.name == role_data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Role already exists")

    new_role = user_model.Role(name=role_data.name)
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    
    create_log(db, current_user, "ROLE_CREATED", f"Created role: {new_role.name}", "Role", new_role.id)
    return new_role

# ✅ NEW: Update Role Endpoint (Fixes 405 Error)
@router.put(
    "/roles/{role_id}", 
    response_model=permission_schema.RoleWithPermissions,
    dependencies=[Depends(require_permission("ROLE_MANAGE"))]
)
def update_role(
    role_id: int,
    role_data: permission_schema.RoleCreate,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(require_permission("ROLE_MANAGE"))
):
    """Update role name."""
    role = db.query(user_model.Role).filter(user_model.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    role.name = role_data.name
    db.commit()
    db.refresh(role)
    
    create_log(db, current_user, "ROLE_UPDATED", f"Updated role to: {role.name}", "Role", role.id)
    return role

# ✅ NEW: Delete Role Endpoint
@router.delete(
    "/roles/{role_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("ROLE_MANAGE"))]
)
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(require_permission("ROLE_MANAGE"))
):
    """Soft delete a role."""
    role = db.query(user_model.Role).filter(user_model.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    # Assuming soft delete logic (or direct delete if preferred)
    # db.delete(role) # Uncomment for hard delete
    # OR Soft Delete:
    from datetime import datetime
    role.deleted_at = datetime.utcnow()
    
    db.commit()
    create_log(db, current_user, "ROLE_DELETED", f"Deleted role ID: {role_id}", "Role", role_id)
    return None

# ==========================================
# 3. ASSIGN PERMISSIONS
# ==========================================

@router.post(
    "/roles/{role_id}/permissions", 
    response_model=permission_schema.RoleWithPermissions,
    dependencies=[Depends(require_permission("ROLE_PERMISSION_ASSIGN"))]
)
def assign_permissions_to_role(
    role_id: int,
    assignment_data: permission_schema.AssignPermissionsToRole,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(require_permission("ROLE_PERMISSION_ASSIGN"))
):
    """Assign permissions to role."""
    db_role = db.query(user_model.Role).filter(
        user_model.Role.id == role_id, user_model.Role.deleted_at.is_(None)
    ).first()
    
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")

    if not assignment_data.permission_ids:
        db_role.permissions = []
    else:
        permissions = db.query(permission_model.Permission).filter(
            permission_model.Permission.id.in_(assignment_data.permission_ids)
        ).all()
        db_role.permissions = permissions

    db.commit()
    db.refresh(db_role)
    
    create_log(db, current_user, "ROLE_PERMISSIONS_UPDATED", f"Updated perms for {db_role.name}", "Role", role_id)
    return db_role