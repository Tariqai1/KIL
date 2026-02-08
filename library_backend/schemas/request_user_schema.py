from pydantic import BaseModel, validator, Field
from typing import Optional, List, Union
from datetime import datetime

# ---------------------------------------------------------
# 1. Base Schema (Common Fields)
# ---------------------------------------------------------
class AccessRequestBase(BaseModel):
    book_id: int
    name: str
    age: Optional[str] = None
    location: Optional[str] = None
    whatsapp: str
    qualification: Optional[str] = None
    institution: Optional[str] = None
    teachers: Optional[str] = None
    is_salafi: bool = False
    previous_work: Optional[str] = None
    
    # Input (Frontend se) Hamesha List aayega
    purpose: List[str]

    @validator('whatsapp')
    def validate_whatsapp(cls, v):
        if len(v) < 10:
            raise ValueError('WhatsApp number sahi nahi hai')
        return v

# ---------------------------------------------------------
# 2. Create Schema (Jab User form bhejega)
# ---------------------------------------------------------
class AccessRequestCreate(AccessRequestBase):
    pass

# ---------------------------------------------------------
# 3. Response Schema (Jab API wapas data bhejegi)
# ---------------------------------------------------------
class AccessRequestResponse(AccessRequestBase):
    id: int
    status: str
    
    # 🆕 Future Proofing: Rejection Reason add kiya
    rejection_reason: Optional[str] = None 
    
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Database mein purpose String hai, lekin humein List chahiye.
    purpose: Union[List[str], str] 

    book_title: Optional[str] = None 
    book_cover: Optional[str] = None

    # --- VALIDATOR (CRITICAL FIX) ---
    @validator('purpose', pre=True)
    def parse_purpose(cls, v):
        # Agar value String hai (Database se aayi hai), to use List bana do
        if isinstance(v, str):
            return v.split(", ")
        return v

    class Config:
        from_attributes = True