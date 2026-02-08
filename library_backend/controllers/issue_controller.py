from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from datetime import datetime

# --- Imports ---
from models import library_management_models as models, user_model
from schemas import library_management_schemas as schemas
from auth import require_permission, get_db
from utils import create_log

router = APIRouter()

# ==================================
# ISSUE & RETURN ENDPOINTS
# ==================================

# --- READ ALL ISSUES (History/Returns) ---
@router.get("/", response_model=List[schemas.IssuedBook])
def get_all_issues(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    # ✅ FIX: 'BOOK_ISSUE' allow kiya taake 'Returns' tab load ho sake
    current_user: user_model.User = Depends(require_permission("BOOK_ISSUE"))
):
    """
    Get list of all issued books (Active & Returned).
    """
    return db.query(models.IssuedBook).options(
        joinedload(models.IssuedBook.book_copy).joinedload(models.BookCopy.book),
        # Agar user relationship defined hai model me to use load karein
        # joinedload(models.IssuedBook.user) 
    ).order_by(models.IssuedBook.id.desc()).offset(skip).limit(limit).all()


# --- ISSUE A BOOK ---
@router.post("/issue", response_model=schemas.IssuedBook, status_code=status.HTTP_201_CREATED)
def issue_book_to_client(
    issue_data: schemas.IssuedBookCreate, 
    db: Session = Depends(get_db),
    # 🔒 Strict: Sirf Issuer hi book issue kar sake
    current_user: user_model.User = Depends(require_permission("BOOK_ISSUE"))
):
    """
    Issues a book copy to a user.
    """
    # 1. Validate Copy
    db_copy = db.query(models.BookCopy).filter(models.BookCopy.id == issue_data.copy_id).first()
    if not db_copy:
        raise HTTPException(status_code=404, detail="Book copy not found")
    
    # Check availability (Allow 'Available' or 'Reference' if policy permits, strictly block 'Issued'/'Lost')
    if db_copy.status not in ["Available", "New"]:
        raise HTTPException(status_code=400, detail=f"Book copy is not available. Current status: {db_copy.status}")
    
    # 2. Validate Client (User exists?)
    client = db.query(user_model.User).filter(user_model.User.id == issue_data.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client (User) not found")

    # 3. Create Issue Record
    db_issue = models.IssuedBook(**issue_data.dict())
    
    # 4. Update Copy Status
    db_copy.status = "Issued"
    
    db.add(db_issue)
    
    # 5. Log Action
    log_desc = f"Copy ID {db_copy.id} issued to '{client.username}'."
    create_log(db, current_user, "BOOK_ISSUED", log_desc, "IssuedBook", db_issue.id)
    
    db.commit()
    db.refresh(db_issue)
    return db_issue


# --- RETURN A BOOK ---
@router.post("/return/{issue_id}", response_model=schemas.IssuedBook)
def return_book(
    issue_id: int, 
    db: Session = Depends(get_db),
    # 🔒 Strict: Sirf Issuer hi book return le sake
    current_user: user_model.User = Depends(require_permission("BOOK_ISSUE"))
):
    """
    Returns a book and marks copy as Available.
    """
    db_issue = db.query(models.IssuedBook).filter(models.IssuedBook.id == issue_id).first()
    if not db_issue:
        raise HTTPException(status_code=404, detail="Issue record not found")
    
    if db_issue.status == "Returned":
        raise HTTPException(status_code=400, detail="Book has already been returned")

    # 1. Update Issue Record
    db_issue.status = "Returned"
    db_issue.actual_return_date = datetime.utcnow()
    
    # 2. Update Copy Status -> Available
    db_copy = db.query(models.BookCopy).filter(models.BookCopy.id == db_issue.copy_id).first()
    if db_copy:
        db_copy.status = "Available"
    
    # 3. Log Action
    log_desc = f"Copy ID {db_issue.copy_id} returned."
    create_log(db, current_user, "BOOK_RETURNED", log_desc, "IssuedBook", db_issue.id)

    db.commit()
    db.refresh(db_issue)
    return db_issue