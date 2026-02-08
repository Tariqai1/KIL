from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from database import get_db
from models.request_user_model import AccessRequest
from models.book_model import Book
from models.user_model import User
from schemas import request_user_schema as schemas
from auth import get_current_user

router = APIRouter()

# Helper: Check if user is Admin
def ensure_admin(user: User):
    if not hasattr(user, 'role') or user.role.name.lower() != "admin":
        raise HTTPException(status_code=403, detail="Sirf Admin hi is page ko access kar sakte hain.")

# ---------------------------------------------------------
# 1. POST: Submit Access Request (Re-Apply for Rejected & Approved)
# ---------------------------------------------------------
# ---------------------------------------------------------
# 1. POST: Submit Access Request
# ---------------------------------------------------------
@router.post("/submit", response_model=schemas.AccessRequestResponse, status_code=status.HTTP_201_CREATED)
def submit_restricted_access_request(
    request_data: schemas.AccessRequestCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submits a new request or updates an existing one.
    """
    # 1. Sabse pehle check karein ki Book exist karti hai
    db_book = db.query(Book).filter(Book.id == request_data.book_id).first()
    if not db_book:
        raise HTTPException(
            status_code=404, 
            detail="Kitab nahi mili jis ke liye request bheji gayi hai."
        )

    # --- Iske niche aapka baki ka logic (existing_request check wagaira) aayega ---
    
    # 1. Check existing request
    existing_request = db.query(AccessRequest).filter(
        AccessRequest.book_id == request_data.book_id,
        AccessRequest.user_id == current_user.id
    ).first()

    # 2. Data Cleaning
    clean_whatsapp = request_data.whatsapp.strip()
    purpose_str = ", ".join(request_data.purpose) 

    if existing_request:
        # CASE A: Pending -> Stop
        if existing_request.status == "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Aapki darkhwast pehle se zer-e-ghaur (Pending) hai."
            )
        
        # CASE B: Rejected OR Approved -> Allow Re-Apply ✅
        if existing_request.status in ["rejected", "approved"]:
            # Update Data
            existing_request.name = request_data.name
            existing_request.whatsapp = clean_whatsapp
            existing_request.qualification = request_data.qualification
            existing_request.institution = request_data.institution
            existing_request.purpose = purpose_str
            existing_request.is_salafi = request_data.is_salafi
            existing_request.previous_work = request_data.previous_work
            
            # Update Optional Fields
            existing_request.age = request_data.age
            existing_request.location = request_data.location
            existing_request.teachers = request_data.teachers
            
            # Reset Status to Pending
            existing_request.status = "pending"
            existing_request.rejection_reason = None 
            existing_request.updated_at = func.now() 
            
            try:
                db.commit()
                db.refresh(existing_request)
                return existing_request
            except Exception as e:
                db.rollback()
                raise HTTPException(status_code=500, detail="Database update failed.")

    # 3. New Request
    new_request = AccessRequest(
        **request_data.model_dump(exclude={'purpose', 'whatsapp'}),
        whatsapp=clean_whatsapp,
        purpose=purpose_str,
        user_id=current_user.id,
        status="pending",
        # updated_at ko bhi abhi set karein taake sorting mein masla na ho
        updated_at=func.now() 
    )
    
    try:
        db.add(new_request)
        db.commit()
        db.refresh(new_request)
        return new_request
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database insert failed.")

# ---------------------------------------------------------
# 2. GET: Check Status (Single Book)
# ---------------------------------------------------------
@router.get("/check-status")
def check_status(
    book_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns status for a specific book."""
    request_entry = db.query(AccessRequest).filter(
        AccessRequest.book_id == book_id, 
        AccessRequest.user_id == current_user.id
    ).first()
    
    if not request_entry:
        return {"status": "not_requested", "can_read": False, "rejection_reason": None}
    
    return {
        "status": request_entry.status, 
        "can_read": request_entry.status == "approved",
        "rejection_reason": request_entry.rejection_reason, 
        "submitted_at": request_entry.created_at
    }

# ---------------------------------------------------------
# 3. GET: User's Notifications (🔔 Improved with Outer Join)
# ---------------------------------------------------------
@router.get("/my-requests", response_model=List[schemas.AccessRequestResponse])
def get_my_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetches all requests for the logged-in user.
    Uses Outer Join so deleted books still show up in history.
    """
    
    # Sort by ID desc (Latest first) - Faster and safer than updated_at
    results = db.query(AccessRequest, Book).outerjoin(Book, AccessRequest.book_id == Book.id)\
        .filter(AccessRequest.user_id == current_user.id)\
        .order_by(desc(AccessRequest.id)).all()

    formatted_requests = []
    for req, book in results:
        obj = req
        if book:
            setattr(obj, "book_title", book.title)
            setattr(obj, "book_cover", book.cover_image_url)
        else:
            setattr(obj, "book_title", "Unknown Book (Removed)")
            setattr(obj, "book_cover", None)
        formatted_requests.append(obj)

    return formatted_requests

# ---------------------------------------------------------
# 4. GET: Admin List (Secured)
# ---------------------------------------------------------
@router.get("/list", response_model=List[schemas.AccessRequestResponse])
def get_all_access_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Admin check needed
):
    """Admin Only: List all requests."""
    ensure_admin(current_user) # 🔐 Security Check
    
    results = db.query(AccessRequest, Book).outerjoin(Book, AccessRequest.book_id == Book.id)\
        .order_by(desc(AccessRequest.created_at)).all()
    
    formatted_requests = []
    for req, book in results:
        obj = req 
        if book:
            setattr(obj, "book_title", book.title)
            setattr(obj, "book_cover", book.cover_image_url)
        else:
            setattr(obj, "book_title", "Unknown Book (Deleted)")
            setattr(obj, "book_cover", None)
        formatted_requests.append(obj)
    return formatted_requests

# ---------------------------------------------------------
# 5. PATCH: Update Status (Secured)
# ---------------------------------------------------------
@router.patch("/{request_id}/status", response_model=schemas.AccessRequestResponse)
def update_request_status(
    request_id: int, 
    status_update: str, 
    rejection_reason: Optional[str] = None, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Admin check needed
):
    """Admin Only: Approve/Reject request."""
    ensure_admin(current_user) # 🔐 Security Check

    db_request = db.query(AccessRequest).filter(AccessRequest.id == request_id).first()
    
    if not db_request:
        raise HTTPException(status_code=404, detail="Request nahi mili.")

    normalized_status = status_update.lower().strip()
    if normalized_status not in ["approved", "rejected", "pending"]:
        raise HTTPException(status_code=400, detail="Invalid Status.")

    # Status Update
    db_request.status = normalized_status
    db_request.updated_at = func.now()
    
    if normalized_status == "rejected":
        db_request.rejection_reason = rejection_reason or "No reason provided."
    elif normalized_status == "approved":
        db_request.rejection_reason = None # Clear reason if approved

    try:
        db.commit()
        db.refresh(db_request)
        return db_request
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Status update failed.")