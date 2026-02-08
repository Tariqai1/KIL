# models/language_model.py
from sqlalchemy import Column, Integer, String, Text, DateTime, func
from sqlalchemy.orm import relationship
from database import Base

class Language(Base):
    __tablename__ = "languages"

    # 1. Primary Key (Legacy naming convention preserved)
    id = Column("LanguageID", Integer, primary_key=True, index=True)
    
    # 2. Basic Info
    name = Column("LanguageName", String(100), unique=True, nullable=False, index=True)
    
    # NEW: ISO Code (e.g., 'en', 'hi', 'ur')
    # Ye Frontend par icons/flags dikhane ke liye bahut useful hota hai
    code = Column("LanguageCode", String(10), unique=True, index=True, nullable=True)
    
    description = Column("Description", Text, nullable=True)

    # 3. Relationships
    # Ensure Book model has: language = relationship("Language", back_populates="books")
    books = relationship("Book", back_populates="language")

    # 4. Timestamps (Standardized)
    # Server side time use karna behtar hota hai consistency ke liye
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Soft Delete Field
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    __table_args__ = {'mysql_engine': 'InnoDB'}

    # Debugging Helper (Console me saaf dikhega)
    def __repr__(self):
        return f"<Language(id={self.id}, name='{self.name}', code='{self.code}')>"