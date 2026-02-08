# schemas/request_schema.py
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from enum import Enum

# ==========================================
# 0. HELPERS & ENUMS (Best Practice)
# ==========================================

# Status ko Enum bana diya taaki spelling mistake na ho
class RequestStatus(str, Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    ISSUED = "Issued"
    RETURNED = "Returned"

# --- LIGHTWEIGHT SCHEMAS TO AVOID CIRCULAR IMPORTS ---
# User aur Book ke full schemas import karne se error aata hai.
# Isliye hum sirf zaruri fields yahan define karenge.
class UserSummary(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    class Config:
        from_attributes = True

class BookSummary(BaseModel):
    id: int
    title: str
    author: Optional[str] = None
    cover_image_url: Optional[str] = None
    is_restricted: bool
    class Config:
        from_attributes = True


# ==========================================
# 1. UPLOAD REQUEST SCHEMAS
#    (For Admin/Staff adding books)
# ==========================================

class UploadRequestBase(BaseModel):
    book_id: int

class UploadRequestCreate(UploadRequestBase):
    pass

class ReviewRequest(BaseModel):
    status: RequestStatus  # Uses Enum
    remarks: Optional[str] = Field(None, max_length=500)

class UploadRequest(UploadRequestBase):
    id: int
    status: str
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None
    remarks: Optional[str] = None
    
    # Nested Lightweight Objects
    submitted_by: Optional[UserSummary] = None
    reviewed_by: Optional[UserSummary] = None
    book: Optional[BookSummary] = None

    class Config:
        from_attributes = True


# ==========================================
# 2. BOOK ACCESS REQUEST SCHEMAS 🚀
#    (For Users requesting Restricted Books)
# ==========================================

# --- A. Data User Send Karega (Request Form) ---
class BookRequestCreate(BaseModel):
    book_id: int
    
    request_reason: str = Field(
        ..., 
        min_length=10, 
        max_length=500,
        description="Reason for requesting this restricted book"
    )
    
    delivery_address: str = Field(
        ..., 
        min_length=5, 
        max_length=255,
        description="Physical delivery address"
    )
    
    contact_number: Optional[str] = Field(None, description="Contact number")
    
    requested_days: int = Field(7, ge=1, le=30, description="Between 1 to 30 days")

    # Phone Number Validation (Regex)
    @validator('contact_number')
    def validate_phone(cls, v):
        if v:
            import re
            # Allows formats like: 9876543210, +91-9876543210
            pattern = r'^(\+\d{1,3}[- ]?)?\d{10}$'
            if not re.match(pattern, v):
                raise ValueError('Invalid phone number format')
        return v


# --- B. Data Admin Update Karega (Approval) ---
class BookRequestUpdate(BaseModel):
    status: RequestStatus # Enum ensures only valid statuses
    rejection_reason: Optional[str] = Field(None, max_length=255)


# --- C. Data Frontend ko dikhega (Response) ---
class BookRequestResponse(BaseModel):
    id: int
    user_id: int
    book_id: int
    
    request_reason: str
    delivery_address: str
    contact_number: Optional[str]
    requested_days: int
    
    status: str
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Nested Lightweight Data (Fast & Error Free)
    book: Optional[BookSummary] = None
    user: Optional[UserSummary] = None 

    class Config:
        from_attributes = True