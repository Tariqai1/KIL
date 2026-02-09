from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Response Model (Frontend will receive these 6 images + ID + timestamp)
class DonationInfoResponse(BaseModel):
    id: int
    
    # --- 1. QR Code ---
    qr_code_desktop: Optional[str] = None
    qr_code_mobile: Optional[str] = None
    
    # --- 2. Appeal ---
    appeal_desktop: Optional[str] = None
    appeal_mobile: Optional[str] = None
    
    # --- 3. Bank Details ---
    bank_desktop: Optional[str] = None
    bank_mobile: Optional[str] = None

    # Timestamp
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # Allows Pydantic to read data from SQLAlchemy models
