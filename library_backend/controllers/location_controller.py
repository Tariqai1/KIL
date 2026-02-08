from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func 

# --- IMPORTS FIXED ---
# 1. Location Model (Apni sahi file se import ho raha hai)
from models.location_model import Location

# 2. BookCopy Model (Ye library management models mein hai)
from models.library_management_models import BookCopy

# 3. Other Imports
from models import user_model
from schemas import library_management_schemas as schemas
from auth import require_permission, get_db
from utils import create_log

router = APIRouter()

# ==================================
# LOCATION ENDPOINTS
# ==================================

# --- CREATE (Admin Only) ---
@router.post("/", response_model=schemas.Location, status_code=status.HTTP_201_CREATED)
def create_location(
    location: schemas.LocationCreate,
    db: Session = Depends(get_db),
    # 🔒 Strict: Sirf Location Manager create kar sake
    current_user: user_model.User = Depends(require_permission("LOCATION_MANAGE"))
):
    """Creates a new physical location for storing books."""
    
    # Check for duplicate name
    if db.query(Location).filter(Location.name == location.name).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Location with name '{location.name}' already exists.")

    # Create new location object
    new_location = Location(**location.dict())
    db.add(new_location)

    create_log(db, current_user, "LOCATION_CREATED", f"Location '{location.name}' created.")

    db.commit()
    db.refresh(new_location)
    return new_location


# --- READ ALL (Accessible to Issuers) ---
@router.get("/", response_model=List[schemas.Location])
def get_all_locations(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    # ✅ FIX: 'BOOK_ISSUE' allow kiya hai taake Copies page par Dropdown load ho sake
    current_user: user_model.User = Depends(require_permission("BOOK_ISSUE"))
):
    """Fetches a list of all defined locations."""
    return db.query(Location).offset(skip).limit(limit).all()


# --- READ ONE (Accessible to Issuers) ---
@router.get("/{location_id}", response_model=schemas.Location) 
def get_location(
    location_id: int, 
    db: Session = Depends(get_db),
    # ✅ FIX: Read access relaxed for issuers
    current_user: user_model.User = Depends(require_permission("BOOK_ISSUE"))
):
    """Fetches details of a specific location by ID."""
    db_location = db.query(Location).filter(Location.id == location_id).first()
    
    if db_location is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
    return db_location


# --- UPDATE (Admin Only) ---
@router.put("/{location_id}", response_model=schemas.Location)
def update_location(
    location_id: int, 
    location_update: schemas.LocationCreate, 
    db: Session = Depends(get_db), 
    current_user: user_model.User = Depends(require_permission("LOCATION_MANAGE"))
):
    """Updates location details."""
    db_location = db.query(Location).filter(Location.id == location_id).first()
    if db_location is None:
        raise HTTPException(status_code=404, detail="Location not found")

    # Check Name Conflict if name is changing
    if location_update.name != db_location.name:
        if db.query(Location).filter(Location.name == location_update.name).first():
            raise HTTPException(status_code=409, detail=f"Location name '{location_update.name}' is already taken.")

    # Update Fields
    db_location.name = location_update.name
    db_location.rack = location_update.rack 
    db_location.shelf = location_update.shelf
    db_location.description = location_update.description

    create_log(db, current_user, "LOCATION_UPDATED", f"Location ID {location_id} updated.")

    db.commit()
    db.refresh(db_location)
    return db_location


# --- DELETE (Admin Only) ---
@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(require_permission("LOCATION_MANAGE"))
):
    """Deletes a location."""
    db_location = db.query(Location).filter(Location.id == location_id).first()
    if db_location is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")

    # --- Dependency Check: Book Copies ---
    # Check agar koi copy is location par physicali rakhi hui hai
    copy_count = db.query(func.count(BookCopy.id)).filter(BookCopy.location_id == location_id).scalar()
    
    if copy_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete location: It is currently holding {copy_count} book copy/copies. Move them first."
        )

    location_name = db_location.name 
    db.delete(db_location) # Hard Delete (Locations usually don't need soft delete if empty)

    create_log(db, current_user, "LOCATION_DELETED", f"Location '{location_name}' (ID: {location_id}) deleted.")

    db.commit()
    return None