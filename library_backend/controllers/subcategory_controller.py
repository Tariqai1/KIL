# file: controllers/subcategory_controller.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func # For count
from typing import List
from datetime import datetime # For soft delete

# Import models and schemas
from models import book_model, user_model
from schemas import subcategory_schema
# Import auth and utils
from auth import require_permission, get_db
from utils import create_log

router = APIRouter()

# --- Helper function to get subcategory with parent ---
def get_subcategory_with_category(db: Session, subcategory_id: int):
    """Fetches a subcategory by ID, including its parent category."""
    return db.query(book_model.Subcategory).options(
        joinedload(book_model.Subcategory.category)
    ).filter(
        book_model.Subcategory.id == subcategory_id,
        book_model.Subcategory.deleted_at.is_(None) # Exclude soft-deleted
    ).first()

# --- CREATE Subcategory ---
@router.post("/", response_model=subcategory_schema.SubcategoryWithCategory, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_permission("CATEGORY_MANAGE"))])
def create_subcategory(
    subcategory: subcategory_schema.SubcategoryCreate,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(require_permission("CATEGORY_MANAGE"))
):
    """Creates a new subcategory under a parent category."""
    # Check if parent category exists and is not deleted
    parent_category = db.query(book_model.Category).filter(
        book_model.Category.id == subcategory.category_id,
        book_model.Category.deleted_at.is_(None)
    ).first()
    if not parent_category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Parent category with id {subcategory.category_id} not found.")

    # Check for duplicate subcategory name within the same parent category
    existing_sub = db.query(book_model.Subcategory).filter(
        book_model.Subcategory.name == subcategory.name,
        book_model.Subcategory.category_id == subcategory.category_id,
        book_model.Subcategory.deleted_at.is_(None)
    ).first()
    if existing_sub:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Subcategory '{subcategory.name}' already exists under category '{parent_category.name}'.")

    db_subcategory = book_model.Subcategory(**subcategory.dict())
    db.add(db_subcategory)
    db.flush() # Get the ID for logging
    create_log(db, current_user, "SUBCATEGORY_CREATED", f"Subcategory '{subcategory.name}' created under '{parent_category.name}'.", "Subcategory", db_subcategory.id)
    db.commit()
    
    # Return the subcategory with its parent category details
    return get_subcategory_with_category(db, db_subcategory.id)

# --- READ ALL Subcategories (Public) ---
@router.get("/", response_model=List[subcategory_schema.SubcategoryWithCategory])
def read_subcategories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Fetches a list of all non-deleted subcategories, including their parent category."""
    return db.query(book_model.Subcategory).options(
        joinedload(book_model.Subcategory.category)
    ).filter(
        book_model.Subcategory.deleted_at.is_(None)
    ).order_by(book_model.Subcategory.id).offset(skip).limit(limit).all()

# --- READ ONE Subcategory (Public) ---
@router.get("/{subcategory_id}", response_model=subcategory_schema.SubcategoryWithCategory)
def read_subcategory(subcategory_id: int, db: Session = Depends(get_db)):
    """Fetches details of a specific non-deleted subcategory by ID."""
    db_subcategory = get_subcategory_with_category(db, subcategory_id)
    if db_subcategory is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subcategory not found")
    return db_subcategory

# --- UPDATE Subcategory ---
@router.put("/{subcategory_id}", response_model=subcategory_schema.SubcategoryWithCategory, dependencies=[Depends(require_permission("CATEGORY_MANAGE"))])
def update_subcategory(
    subcategory_id: int,
    subcategory_update: subcategory_schema.SubcategoryCreate, # Reuse create schema
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(require_permission("CATEGORY_MANAGE"))
):
    """Updates an existing subcategory."""
    db_subcategory = db.query(book_model.Subcategory).filter(
        book_model.Subcategory.id == subcategory_id,
        book_model.Subcategory.deleted_at.is_(None)
    ).first()
    if db_subcategory is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subcategory not found")

    # Check if the new parent category exists
    if subcategory_update.category_id != db_subcategory.category_id:
        parent_category = db.query(book_model.Category).filter(
            book_model.Category.id == subcategory_update.category_id,
            book_model.Category.deleted_at.is_(None)
        ).first()
        if not parent_category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"New parent category with id {subcategory_update.category_id} not found.")

    # Check for duplicate name under the (potentially new) parent
    if (subcategory_update.name != db_subcategory.name or subcategory_update.category_id != db_subcategory.category_id):
         existing_sub = db.query(book_model.Subcategory).filter(
            book_model.Subcategory.name == subcategory_update.name,
            book_model.Subcategory.category_id == subcategory_update.category_id,
            book_model.Subcategory.id != subcategory_id, # Exclude self
            book_model.Subcategory.deleted_at.is_(None)
        ).first()
         if existing_sub:
             parent_name = db.query(book_model.Category.name).filter(book_model.Category.id == subcategory_update.category_id).scalar() or "N/A"
             raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Subcategory '{subcategory_update.name}' already exists under category '{parent_name}'.")

    # Update fields
    db_subcategory.name = subcategory_update.name
    db_subcategory.description = subcategory_update.description
    db_subcategory.category_id = subcategory_update.category_id

    create_log(db, current_user, "SUBCATEGORY_UPDATED", f"Subcategory ID {subcategory_id} ('{db_subcategory.name}') updated.")
    db.commit()
    
    # Return the updated subcategory with its parent category details
    return get_subcategory_with_category(db, subcategory_id)

# --- DELETE Subcategory (Soft Delete) ---
@router.delete("/{subcategory_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_permission("CATEGORY_MANAGE"))])
def delete_subcategory(
    subcategory_id: int,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(require_permission("CATEGORY_MANAGE"))
):
    """Soft deletes a subcategory."""
    db_subcategory = db.query(book_model.Subcategory).filter(
        book_model.Subcategory.id == subcategory_id,
        book_model.Subcategory.deleted_at.is_(None)
    ).first()
    if db_subcategory is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subcategory not found")

    # --- Check for dependencies: Books ---
    # Check if any books are linked via the association table
    book_count = db.query(func.count(book_model.book_subcategory_link.c.book_id)).filter(
        book_model.book_subcategory_link.c.subcategory_id == subcategory_id
    ).scalar()
    
    if book_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete subcategory: It is associated with {book_count} book(s)."
        )
    # --- End check ---

    subcategory_name = db_subcategory.name # Get name for logging
    db_subcategory.deleted_at = datetime.utcnow() # Perform soft delete
    
    create_log(db, current_user, "SUBCATEGORY_DELETED", f"Subcategory '{subcategory_name}' (ID: {subcategory_id}) soft-deleted.")
    db.commit()
    return None