from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

# Imports
# Hum BookCopy ko import kar rahe hain. User ko string "User" se refer karenge circular import bachane ke liye.
from models.library_management_models import BookCopy 

class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    
    # --- Foreign Keys ---
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Note: Aapke BookCopy table mein primary key "CopyID" hai
    book_copy_id = Column(Integer, ForeignKey("book_copies.CopyID"), nullable=False)

    # --- Dates & Status ---
    issue_date = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=True)
    return_date = Column(DateTime, nullable=True)
    
    status = Column(String(50), default="Issued") # Issued, Returned, Overdue

    # --- RELATIONSHIPS (FIXED) ---
    
    # 1. User Relationship
    # FIX: Iska naam 'client' se badal kar 'user' kiya gaya hai
    # taaki ye User model ke back_populates="user" se match kare.
    user = relationship("User", back_populates="issues")

    # 2. BookCopy Relationship
    # Humne back_populates hata diya hai taaki conflict na ho (One-Way link)
    book_copy = relationship("BookCopy")

    __table_args__ = {'mysql_engine': 'InnoDB'}