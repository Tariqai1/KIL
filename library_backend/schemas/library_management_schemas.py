 # File: schemas/library_management_schemas.py

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# Sahi schemas ko import karein
from . import book_schema 
from . import user_schema

# --- Location Schemas (Isi file me define kiye gaye) ---
class LocationBase(BaseModel):
    name: str
    rack: Optional[str] = None
    shelf: Optional[str] = None
    section_name: Optional[str] = None
    description: Optional[str] = None

class LocationCreate(LocationBase):
    pass

class Location(LocationBase):
    id: int
    class Config:
        from_attributes = True

# --- BookCopy Schemas ---
class BookCopyBase(BaseModel):
    book_id: int
    location_id: int
    status: str = "Available"

class BookCopyCreate(BookCopyBase):
    pass

class BookCopy(BookCopyBase):
    id: int
    book: book_schema.Book
    location: Location  # Yahan Location schema ka istemal ho raha hai
    class Config:
        from_attributes = True

# --- IssuedBook Schemas ---
class IssuedBookBase(BaseModel):
    client_id: int
    copy_id: int
    due_date: datetime

class IssuedBookCreate(IssuedBookBase):
    pass
    
class IssuedBook(IssuedBookBase):
    id: int
    issue_date: datetime
    actual_return_date: Optional[datetime] = None
    status: str
    client: user_schema.User
    book_copy: BookCopy
    class Config:
        from_attributes = True

# --- DigitalAccess Schemas ---
class DigitalAccessBase(BaseModel):
    client_id: int
    book_id: int

class DigitalAccessCreate(DigitalAccessBase):
    pass

class DigitalAccess(DigitalAccessBase):
    id: int
    access_granted: bool
    access_timestamp: datetime
    client: user_schema.User
    book: book_schema.Book
    class Config:
        from_attributes = True