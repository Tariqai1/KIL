from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime

# --- IMPORTS (Safe for your structure) ---
try:
    from models import book_model, user_model, request_model
except ImportError:
    # Fallback agar file names alag hon
    from models import library_management_models as request_model
    from models import user_model, book_model

from schemas import request_schema
from auth import require_permission, get_db, get_current_user
from utils import create_log

# Tagging for Swagger UI
router = APIRouter(tags=["Requests Management"])

# ==============================================================================
# 🛠️ HELPER FUNCTIONS
# ==============================================================================

def get_upload_request_details(db: Session, request_id: int):
    """ Helper to fetch request with all relations loaded """
    return db.query(request_model.UploadRequest).options(
        joinedload(request_model.UploadRequest.book),
        joinedload(request_model.UploadRequest.submitted_by),
        joinedload(request_model.UploadRequest.reviewed_by)
    ).filter(request_model.UploadRequest.id == request_id).first()

# ==============================================================================
# 📤 SECTION 1: UPLOAD REQUESTS (Staff Upload -> Admin Approve)
# ==============================================================================

@router.post("/upload", response_model=request_schema.UploadRequest, status_code=status.HTTP_201_CREATED)
def create_upload_request(
    request: request_schema.UploadRequestCreate,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(require_permission("REQUEST_CREATE"))
):
    """
    Staff: Jab nayi book upload karein, to approval request banayein.
    """
    # 1. Check if Book exists
    db_book = db.query(book_model.Book).filter(book_model.Book.id == request.book_id).first()
    if not db_book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # 2. Check Duplicate Request
    existing_req = db.query(request_model.UploadRequest).filter(
        request_model.UploadRequest.book_id == request.book_id,
        request_model.UploadRequest.status == 'Pending'
    ).first()
    
    if existing_req:
        raise HTTPException(status_code=409, detail="A pending request for this book already exists.")

    # 3. Create Request
    new_request = request_model.UploadRequest(
        book_id=request.book_id,
        submitted_by_id=current_user.id,
        status='Pending' # Default pending
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    
    create_log(db, current_user, "UPLOAD_REQUEST", f"Approval requested for Book ID {request.book_id}", "UploadRequest", new_request.id)
    
    return get_upload_request_details(db, new_request.id)


@router.get("/upload", response_model=List[request_schema.UploadRequest])
def get_all_upload_requests(
    status_filter: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    """ Admin View: List all book approval requests. """
    query = db.query(request_model.UploadRequest).options(
        joinedload(request_model.UploadRequest.book),
        joinedload(request_model.UploadRequest.submitted_by),
        joinedload(request_model.UploadRequest.reviewed_by)
    )
    
    if status_filter:
        query = query.filter(request_model.UploadRequest.status == status_filter)
        
    return query.order_by(request_model.UploadRequest.submitted_at.desc()).all()


@router.put("/upload/{request_id}/review", response_model=request_schema.UploadRequest)
def review_upload_request(
    request_id: int,
    review_data: request_schema.ReviewRequest,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(require_permission("REQUEST_APPROVE"))
):
    """ 
    Admin Action: Approve or Reject a book.
    ✅ FIXED: Updates 'is_approved' flag in Book table correctly.
    """
    # 1. Fetch Request
    db_request = db.query(request_model.UploadRequest).filter(request_model.UploadRequest.id == request_id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Optional: Prevent re-reviewing (You can remove this if you want to allow changing decisions)
    # if db_request.status != 'Pending':
    #     raise HTTPException(status_code=400, detail="Request already reviewed")
    
    # 2. Update Request Meta Data
    db_request.status = review_data.status
    db_request.remarks = review_data.remarks
    db_request.reviewed_by_id = current_user.id
    db_request.reviewed_at = datetime.utcnow()
    
    # 3. 🔥 CRITICAL FIX: Update the actual Book status
    book = db.query(book_model.Book).filter(book_model.Book.id == db_request.book_id).first()
    
    if book:
        if review_data.status == 'Approved':
            book.is_approved = True  # Publicly Visible
        elif review_data.status == 'Rejected':
            book.is_approved = False # Hidden from users
    else:
        # Agar book delete ho gayi ho database se
        db_request.remarks += " (Warning: Linked Book ID not found)"

    db.commit()
    
    create_log(db, current_user, "REQUEST_REVIEW", f"Upload Request {request_id} {review_data.status}", "UploadRequest", request_id)
    
    return get_upload_request_details(db, request_id)


# ==============================================================================
# 📖 SECTION 2: USER ACCESS REQUESTS (User -> Borrow Restricted Book)
# ==============================================================================

@router.post("/access", response_model=request_schema.BookRequestResponse, status_code=status.HTTP_201_CREATED)
def request_book_access(
    request_data: request_schema.BookRequestCreate,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """ User requests to read/borrow a restricted book. """
    # 1. Validate Book
    book = db.query(book_model.Book).filter(book_model.Book.id == request_data.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # 2. Check Duplicate Pending Request
    existing = db.query(request_model.BookRequest).filter(
        request_model.BookRequest.user_id == current_user.id,
        request_model.BookRequest.book_id == request_data.book_id,
        request_model.BookRequest.status == "Pending"
    ).first()
    
    if existing:
        raise HTTPException(status_code=409, detail="You already have a pending request for this book.")

    # 3. Create Request
    new_req = request_model.BookRequest(
        user_id=current_user.id,
        book_id=request_data.book_id,
        request_reason=request_data.request_reason,
        delivery_address=request_data.delivery_address,
        contact_number=request_data.contact_number,
        requested_days=request_data.requested_days,
        status="Pending"
    )
    
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    
    return db.query(request_model.BookRequest).options(
        joinedload(request_model.BookRequest.book),
        joinedload(request_model.BookRequest.user)
    ).filter(request_model.BookRequest.id == new_req.id).first()


@router.get("/access/my-requests", response_model=List[request_schema.BookRequestResponse])
def get_my_access_requests(
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_user)
):
    """ Get logged-in user's requests history """
    return db.query(request_model.BookRequest).options(
        joinedload(request_model.BookRequest.book),
        joinedload(request_model.BookRequest.user)
    ).filter(
        request_model.BookRequest.user_id == current_user.id
    ).order_by(request_model.BookRequest.created_at.desc()).all()


@router.get("/access/all", response_model=List[request_schema.BookRequestResponse])
def get_all_access_requests(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(require_permission("REQUEST_APPROVE"))
):
    """ Admin View: See all borrow requests from users """
    query = db.query(request_model.BookRequest).options(
        joinedload(request_model.BookRequest.book),
        joinedload(request_model.BookRequest.user)
    )
    
    if status:
        query = query.filter(request_model.BookRequest.status == status)
        
    return query.order_by(request_model.BookRequest.created_at.desc()).all()


@router.put("/access/{request_id}/review", response_model=request_schema.BookRequestResponse)
def review_access_request(
    request_id: int,
    update_data: request_schema.BookRequestUpdate,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(require_permission("REQUEST_APPROVE"))
):
    """ Admin approves/rejects user borrow request """
    req = db.query(request_model.BookRequest).filter(request_model.BookRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    req.status = update_data.status
    if update_data.rejection_reason:
        req.rejection_reason = update_data.rejection_reason
    
    req.updated_at = datetime.utcnow()
    
    create_log(db, current_user, "ACCESS_REVIEW", f"Access Request {request_id} set to {update_data.status}", "BookRequest", request_id)
    
    db.commit()
    db.refresh(req)
    
    return db.query(request_model.BookRequest).options(
        joinedload(request_model.BookRequest.book),
        joinedload(request_model.BookRequest.user)
    ).filter(request_model.BookRequest.id == request_id).first()