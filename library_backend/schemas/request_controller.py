from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .user_schema import User  # Ensure User schema exists
from .book_schema import Book  # ✅ IMPORT FULL BOOK SCHEMA (Not BookBase)

# --- Shared Properties ---
class RequestBase(BaseModel):
    status: str = "Pending"
    remarks: Optional[str] = None

# ==========================================================
# 📤 UPLOAD REQUEST SCHEMA
# ==========================================================

class UploadRequestCreate(BaseModel):
    book_id: int

class ReviewRequest(BaseModel):
    status: str # Approved / Rejected
    remarks: Optional[str] = None

class UploadRequest(RequestBase):
    id: int
    book_id: int
    submitted_by_id: Optional[int] = None
    reviewed_by_id: Optional[int] = None
    
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None

    # ✅ CRITICAL FIX: Use the full Book schema here
    # This ensures 'pdf_url' and 'cover_image_url' are sent to frontend
    book: Optional[Book] = None
    
    submitted_by: Optional[User] = None
    reviewed_by: Optional[User] = None

    class Config:
        from_attributes = True

# ==========================================================
# 📘 BOOK ACCESS REQUEST SCHEMA
# ==========================================================

class BookRequestCreate(BaseModel):
    book_id: int
    request_reason: Optional[str] = None
    delivery_address: Optional[str] = None
    contact_number: Optional[str] = None
    requested_days: int = 7

class BookRequestUpdate(BaseModel):
    status: str
    rejection_reason: Optional[str] = None

class BookRequestResponse(BaseModel):
    id: int
    user_id: int
    book_id: int
    status: str
    request_type: str
    request_reason: Optional[str] = None
    rejection_reason: Optional[str] = None
    
    delivery_address: Optional[str] = None
    contact_number: Optional[str] = None
    requested_days: int
    
    created_at: datetime
    updated_at: Optional[datetime] = None

    # Relationships
    book: Optional[Book] = None
    user: Optional[User] = None

    class Config:
        from_attributes = True