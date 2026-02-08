from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

# --- Imports ---
from models import library_management_models as models, user_model
from schemas import library_management_schemas as schemas
from auth import require_permission
from database import get_db
from utils import create_log

router = APIRouter()

# ==================================
# COPY ENDPOINTS
# ==================================

# --- CREATE COPY (Inventory Add) ---
@router.post("/", response_model=schemas.BookCopy, status_code=status.HTTP_201_CREATED)
def create_book_copy(
    copy: schemas.BookCopyCreate, 
    db: Session = Depends(get_db),
    # ✅ FIX: 'COPY_MANAGE' hata kar 'BOOK_MANAGE' kar diya (jo aapke paas available hai)
    current_user: user_model.User = Depends(require_permission("BOOK_MANAGE"))
):
    """
    Create a new physical copy of a book.
    Requires BOOK_MANAGE permission.
    """
    # 1. Create Model
    db_copy = models.BookCopy(**copy.dict())
    db.add(db_copy)
    
    # 2. Log Action
    create_log(
        db=db, 
        user=current_user, 
        action_type="COPY_CREATED", 
        description=f"New copy created for Book ID {copy.book_id}.",
        target_type="BookCopy"
    )
    
    db.commit()
    db.refresh(db_copy)
    return db_copy


# --- READ ALL COPIES ---
@router.get("/", response_model=List[schemas.BookCopy])
def get_all_book_copies(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    # ✅ FIX: 'BOOK_ISSUE' rakha hai taake Student/Issuer list dekh sake
    current_user: user_model.User = Depends(require_permission("BOOK_ISSUE")) 
):
    """
    Get list of all book copies.
    """
    return db.query(models.BookCopy).options(
        joinedload(models.BookCopy.book),
        joinedload(models.BookCopy.location)
    ).offset(skip).limit(limit).all()


# --- READ ONE COPY ---
@router.get("/{copy_id}", response_model=schemas.BookCopy)
def get_book_copy(
    copy_id: int, 
    db: Session = Depends(get_db),
    # ✅ FIX: 'BOOK_ISSUE' rakha hai
    current_user: user_model.User = Depends(require_permission("BOOK_ISSUE"))
):
    """
    Get details of a specific copy.
    """
    db_copy = db.query(models.BookCopy).options(
        joinedload(models.BookCopy.book),
        joinedload(models.BookCopy.location)
    ).filter(models.BookCopy.id == copy_id).first()
    
    if not db_copy:
        raise HTTPException(status_code=404, detail="Book copy not found")
    
    return db_copy