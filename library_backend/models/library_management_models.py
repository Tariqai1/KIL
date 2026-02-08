# models/library_management_models.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, TIMESTAMP, DateTime, func
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

# Note: 'Book' aur 'User' hum circular imports se bachne ke liye string references ("Book", "User") use karenge.

# --- DELETE LOCATION CLASS ---
# (Yahan se Location class hata di gayi hai kyunki wo ab models/location_model.py mein hai)

class BookCopy(Base):
    """
    Legacy Model: Individual physical copies (Barcode tracking).
    Agar aap naya 'total_copies' system use kar rahe hain toh iski zarurat kam hai,
    par purane data ke liye ise rakh sakte hain.
    """
    __tablename__ = "book_copies"
    id = Column("CopyID", Integer, primary_key=True, autoincrement=True)
    
    book_id = Column("BookID", Integer, ForeignKey("books.id"), nullable=False)
    location_id = Column("LocationID", Integer, ForeignKey("locations.id"), nullable=False)
    
    status = Column("Status", String(50), nullable=False, default="Available")
    
    # Relationships
    book = relationship("Book")
    
    # FIX: 'back_populates' hata diya kyunki naye Location model mein 'book_copies' nahi hai.
    # Ab ye sirf one-way link rahega (Safe Mode).
    location = relationship("Location") 
    
    issue_records = relationship("IssuedBook", back_populates="book_copy")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    
    __table_args__ = {'mysql_engine': 'InnoDB'}

class IssuedBook(Base):
    __tablename__ = "issued_books"
    id = Column("IssuedBookID", Integer, primary_key=True, autoincrement=True)
    
    client_id = Column("ClientID", Integer, ForeignKey("users.id"), nullable=False)
    copy_id = Column("CopyID", Integer, ForeignKey("book_copies.CopyID"), nullable=False)
    
    issue_date = Column("IssueDate", DateTime, default=datetime.utcnow, nullable=False)
    due_date = Column("ReturnDate", DateTime, nullable=False)
    actual_return_date = Column("ActualReturnDate", DateTime, nullable=True)
    
    status = Column("Status", String(50), default="Issued")
    
    # Relationships
    client = relationship("User")
    book_copy = relationship("BookCopy", back_populates="issue_records")
    
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    __table_args__ = {'mysql_engine': 'InnoDB'}

class DigitalAccess(Base):
    __tablename__ = "digital_access"
    id = Column("DigitalAccessID", Integer, primary_key=True, autoincrement=True)
    
    client_id = Column("ClientID", Integer, ForeignKey("users.id"), nullable=False)
    book_id = Column("BookID", Integer, ForeignKey("books.id"), nullable=False)
    
    access_granted = Column("AccessGranted", Boolean, default=True)
    access_timestamp = Column("AccessTimestamp", DateTime, default=datetime.utcnow, nullable=False)
    
    client = relationship("User")
    book = relationship("Book")
    
    __table_args__ = {'mysql_engine': 'InnoDB'}