from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func 

# --- Imports ---
from models import book_model, user_model
from schemas import category_schema
from auth import require_permission, get_db
from utils import create_log

router = APIRouter()

# ==================================
# CATEGORY ENDPOINTS
# ==================================

# --- CREATE (Admin Only) ---
@router.post("/", response_model=category_schema.Category, status_code=status.HTTP_201_CREATED)
def create_category(
    category: category_schema.CategoryCreate,
    db: Session = Depends(get_db),
    # 🔒 Strict: Sirf Category Manager hi create kar sake
    current_user: user_model.User = Depends(require_permission("CATEGORY_MANAGE"))
):
    """Creates a new category."""
    # Check for duplicate active category
    if db.query(book_model.Category).filter(
        book_model.Category.name == category.name, 
        book_model.Category.deleted_at.is_(None)
    ).first():
        raise HTTPException(status_code=409, detail="Category with this name already exists")

    new_category = book_model.Category(
        name=category.name,
        description=category.description
    )
    db.add(new_category)
    
    create_log(db, current_user, "CATEGORY_CREATED", f"Category '{category.name}' created.")
    
    db.commit()
    db.refresh(new_category)
    return new_category


# --- READ ALL (Accessible to Students/Staff) ---
@router.get("/", response_model=List[category_schema.Category])
def read_categories(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    # ✅ FIX: 'BOOK_VIEW' allow kiya hai taake Student dropdown dekh sake
    current_user: user_model.User = Depends(require_permission("BOOK_VIEW"))
):
    """Fetches a list of all non-deleted categories."""
    return db.query(book_model.Category).filter(
        book_model.Category.deleted_at.is_(None)
    ).order_by(book_model.Category.id).offset(skip).limit(limit).all()


# --- READ ONE (Accessible to Students/Staff) ---
@router.get("/{category_id}", response_model=category_schema.Category)
def read_category(
    category_id: int, 
    db: Session = Depends(get_db),
    # ✅ FIX: 'BOOK_VIEW' allow kiya hai
    current_user: user_model.User = Depends(require_permission("BOOK_VIEW"))
):
    """Fetches a specific non-deleted category by ID."""
    db_category = db.query(book_model.Category).filter(
        book_model.Category.id == category_id, 
        book_model.Category.deleted_at.is_(None)
    ).first()
    
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return db_category


# --- UPDATE (Admin Only) ---
@router.put("/{category_id}", response_model=category_schema.Category)
def update_category(
    category_id: int,
    category_update: category_schema.CategoryCreate,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(require_permission("CATEGORY_MANAGE"))
):
    """Updates an existing category."""
    db_category = db.query(book_model.Category).filter(
        book_model.Category.id == category_id, 
        book_model.Category.deleted_at.is_(None)
    ).first()
    
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")

    # Check for name conflict with other categories
    if category_update.name != db_category.name:
        existing = db.query(book_model.Category).filter(
            book_model.Category.name == category_update.name, 
            book_model.Category.deleted_at.is_(None)
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="Another category with this name already exists")

    # Update fields
    db_category.name = category_update.name
    db_category.description = category_update.description
    
    create_log(db, current_user, "CATEGORY_UPDATED", f"Category ID {category_id} updated to '{category_update.name}'.")
    
    db.commit()
    db.refresh(db_category)
    return db_category


# --- DELETE (Admin Only) ---
@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(require_permission("CATEGORY_MANAGE"))
):
    """Soft deletes a category."""
    db_category = db.query(book_model.Category).filter(
        book_model.Category.id == category_id, 
        book_model.Category.deleted_at.is_(None)
    ).first()
    
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")

    # Dependency Check: Subcategories
    subcategory_count = db.query(func.count(book_model.Subcategory.id)).filter(
        book_model.Subcategory.category_id == category_id,
        book_model.Subcategory.deleted_at.is_(None)
    ).scalar()
    
    if subcategory_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete category: It is associated with {subcategory_count} active subcategory(ies)."
        )

    category_name = db_category.name
    db_category.deleted_at = datetime.utcnow() # Soft delete
    
    create_log(db, current_user, "CATEGORY_DELETED", f"Category '{category_name}' (ID: {category_id}) soft-deleted.")
    
    db.commit()
    return None