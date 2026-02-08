from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base

class AccessRequest(Base):
    __tablename__ = "access_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Agar login user hai
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    
    # Form Fields
    name = Column(String, nullable=False)
    age = Column(String, nullable=True)
    location = Column(String, nullable=True)
    whatsapp = Column(String, nullable=False)
    qualification = Column(String, nullable=True)
    institution = Column(String, nullable=True)
    teachers = Column(Text, nullable=True)
    is_salafi = Column(Boolean, default=False)
    purpose = Column(Text, nullable=True) # JSON string ya comma separated
    previous_work = Column(Text, nullable=True)
    
    # Status Management
    status = Column(String, default="pending") # pending, approved, rejected
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())