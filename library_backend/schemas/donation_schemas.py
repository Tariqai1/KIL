from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Response Model (Frontend ko ye 6 images milengi)
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

    updated_at: datetime

    class Config:
        from_attributes = True  # ORM mode on