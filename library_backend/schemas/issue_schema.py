from typing import Optional, Any, Dict  # <--- 'Any' sabse zaroori import hai
from pydantic import BaseModel, Field
from datetime import datetime, date

# --- Base Schemas ---

class IssueBase(BaseModel):
    copy_id: int
    client_id: int
    due_date: date

class IssueCreate(IssueBase):
    pass 

class IssueUpdate(BaseModel):
    status: str 
    return_date: Optional[date] = None

# --- Nested Schema (Optional reference) ---
class BookCopyInIssue(BaseModel):
    id: int
    book_id: int
    status: str
    book: Optional[Any] = None 
    
    class Config:
        from_attributes = True

# --- FINAL "NO-CRASH" RESPONSE SCHEMA ---

class Issue(IssueBase):
    id: int
    issue_date: datetime
    return_date: Optional[datetime] = None
    status: str = Field(..., examples=["Issued", "Returned"])
    
    # --- BRAHMASTRA FIX ---
    # Hum yahan 'Any' use kar rahe hain. 
    # Iska matlab: "Backend bhai, agar book_copy hai to de do, 
    # nahi hai to null de do, par CRASH MAT KARNA please."
    book_copy: Optional[Any] = None 
    
    # Same for User
    client: Optional[Any] = None 
    librarian_issuer: Optional[Any] = None

    class Config:
        from_attributes = True