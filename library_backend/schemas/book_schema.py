from pydantic import BaseModel, Field, model_validator
from typing import Optional, List
from datetime import date, datetime

# --- Import Dependent Schemas ---
# Ensure these files exist in your project
from .language_schema import Language as LanguageSchema
from .subcategory_schema import Subcategory as SubcategorySchema 

# ==============================================================================
# 🟢 1. BASE SCHEMA (Shared Fields)
# ==============================================================================
class BookBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    author: Optional[str] = Field(None, max_length=255)
    publisher: Optional[str] = Field(None, max_length=255)
    publication_year: Optional[int] = Field(None, gt=0, lt=9999)
    isbn: Optional[str] = Field(None, max_length=20)
    is_digital: bool = Field(False)
    description: Optional[str] = None
    language_id: int = Field(...) 
    is_restricted: bool = Field(False)
    
    # Additional Fields
    serial_number: Optional[str] = Field(None, max_length=100)
    book_number: Optional[str] = Field(None, max_length=100)
    parts_or_volumes: Optional[str] = Field(None, max_length=100)
    pages: Optional[int] = Field(None, gt=0)
    subject_number: Optional[str] = Field(None, max_length=100)
    translator: Optional[str] = Field(None, max_length=255)
    price: Optional[float] = Field(None, ge=0)
    date_of_purchase: Optional[date] = None
    edition: Optional[str] = Field(None, max_length=100)
    remarks: Optional[str] = None
    
    # Images
    cover_image: Optional[str] = None 
    cover_image_url: Optional[str] = None
    
    # PDFs
    pdf_url: Optional[str] = None
    pdf_file: Optional[str] = None

# ==============================================================================
# 🟡 2. CREATE SCHEMA (Input)
# ==============================================================================
class BookCreate(BookBase):
    subcategory_ids: List[int] = [] 

# ==============================================================================
# 🟠 3. UPDATE SCHEMA (Input)
# ==============================================================================
class BookUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    author: Optional[str] = Field(None, max_length=255)
    publisher: Optional[str] = Field(None, max_length=255)
    publication_year: Optional[int] = Field(None, gt=0, lt=9999)
    isbn: Optional[str] = Field(None, max_length=20)
    is_digital: Optional[bool] = None
    description: Optional[str] = None
    language_id: Optional[int] = None
    is_restricted: Optional[bool] = None
    
    serial_number: Optional[str] = Field(None, max_length=100)
    book_number: Optional[str] = Field(None, max_length=100)
    parts_or_volumes: Optional[str] = Field(None, max_length=100)
    pages: Optional[int] = Field(None, gt=0)
    subject_number: Optional[str] = Field(None, max_length=100)
    translator: Optional[str] = Field(None, max_length=255)
    price: Optional[float] = Field(None, ge=0)
    date_of_purchase: Optional[date] = None
    edition: Optional[str] = Field(None, max_length=100)
    remarks: Optional[str] = None
    
    subcategory_ids: Optional[List[int]] = None
    
    # Files update support
    cover_image: Optional[str] = None
    cover_image_url: Optional[str] = None
    pdf_url: Optional[str] = None
    pdf_file: Optional[str] = None

# ==============================================================================
# 🔵 4. RESPONSE SCHEMA (Output)
# ==============================================================================
class Book(BookBase):
    id: int
    is_approved: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None

    # ✅ THIS IS THE FIX: New field to tell Frontend if user has access
    user_has_access: bool = False 

    # Nested Relationships
    language: Optional[LanguageSchema] = None
    subcategories: List[SubcategorySchema] = []

    # ✅ SMART VALIDATOR
    @model_validator(mode='after')
    def sync_file_urls(self):
        # Sync Cover Image
        if self.cover_image and not self.cover_image_url:
            self.cover_image_url = self.cover_image
        elif self.cover_image_url and not self.cover_image:
            self.cover_image = self.cover_image_url

        # Sync PDF
        if self.pdf_file and not self.pdf_url:
            self.pdf_url = self.pdf_file
        elif self.pdf_url and not self.pdf_file:
            self.pdf_file = self.pdf_url
            
        return self

    class Config:
        from_attributes = True