from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, Table, TIMESTAMP, DateTime, func, Float, Date
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

# --- Association Table (Many-to-Many for Subcategories) ---
book_subcategory_link = Table(
    'book_subcategory_link',
    Base.metadata,
    Column('book_id', Integer, ForeignKey('books.id', ondelete="CASCADE"), primary_key=True),
    Column('subcategory_id', Integer, ForeignKey('subcategories.id', ondelete="CASCADE"), primary_key=True),
    mysql_engine='InnoDB'
)

# --- Category Model ---
class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Relationships
    subcategories = relationship("Subcategory", back_populates="category", cascade="all, delete-orphan")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    
    __table_args__ = {'mysql_engine': 'InnoDB'}

# --- Subcategory Model ---
class Subcategory(Base):
    __tablename__ = "subcategories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Foreign Key
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    
    # Relationships
    category = relationship("Category", back_populates="subcategories")
    books = relationship("Book", secondary=book_subcategory_link, back_populates="subcategories")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    
    __table_args__ = {'mysql_engine': 'InnoDB'}

# --- Book Model (Fixed) ---
class Book(Base):
    __tablename__ = "books"
    
    # 1. Basic Info
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), index=True, nullable=False)
    author = Column(String(255), nullable=True, index=True) 
    publisher = Column(String(255), nullable=True) 
    published_date = Column(Date, nullable=True) 
    isbn = Column(String(20), unique=True, index=True, nullable=True)
    edition = Column(String(100), nullable=True)
    
    # 2. Categorization & Language
    language_id = Column(Integer, ForeignKey("languages.LanguageID", ondelete="SET NULL"), nullable=True)
    
    # 3. Digital & Media
    is_digital = Column(Boolean, default=False)
    cover_image_url = Column(Text, nullable=True)
    pdf_url = Column(Text, nullable=True)      
    txt_file_url = Column(Text, nullable=True) 
    description = Column(Text, nullable=True)

    # 4. Access Control
    is_approved = Column(Boolean, default=False)   
    is_restricted = Column(Boolean, default=False) 

    # 5. Physical Inventory
    total_copies = Column(Integer, default=1, nullable=False)
    available_copies = Column(Integer, default=1, nullable=False)
    
    # 6. Location
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="SET NULL"), nullable=True)

    # 7. Library Specific Fields
    serial_number = Column(String(100), nullable=True, index=True)
    book_number = Column(String(100), nullable=True, index=True)
    parts_or_volumes = Column(String(100), nullable=True)
    page_count = Column(Integer, nullable=True)
    subject_number = Column(String(100), nullable=True)
    translator = Column(String(255), nullable=True)
    price = Column(Float, nullable=True)
    date_of_purchase = Column(Date, nullable=True)
    remarks = Column(Text, nullable=True)

    # 8. Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime, nullable=True) 

    # --- Relationships ---
    
    language = relationship("Language") 
    subcategories = relationship("Subcategory", secondary=book_subcategory_link, back_populates="books")
    location = relationship("Location")
    
    upload_request = relationship("UploadRequest", back_populates="book", cascade="all, delete-orphan", uselist=False)
    requests = relationship("BookRequest", cascade="all, delete-orphan")
    
    __table_args__ = {'mysql_engine': 'InnoDB'}

    # 🔥🔥🔥 MAGIC FIX STARTS HERE 🔥🔥🔥
    # Ye property backend ko "Smart" banati hai.
    # Agar koi 'cover_image' mange, to ye 'cover_image_url' ki value de dega.
    # Isse Public aur Admin dono API khush rahenge.
    
    @property
    def cover_image(self):
        return self.cover_image_url

    @property
    def pdf_file(self):
        return self.pdf_url
    # 🔥🔥🔥 MAGIC FIX ENDS HERE 🔥🔥🔥