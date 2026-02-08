from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class AccessRequest(Base):
    __tablename__ = "access_requests_user"

    id = Column(Integer, primary_key=True, index=True)

    # ==========================================================
    # 🔗 RELATIONS (User & Book) - Flipkart Style Core
    # ==========================================================
    # Ab hum User ID save karenge. nullable=False ka matlab hai
    # bina Login kiye koi request nahi bhej sakta.
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"), nullable=False, index=True)

    # ==========================================================
    # 📝 USER FORM DATA
    # ==========================================================
    name = Column(String(255), nullable=False)
    age = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)
    whatsapp = Column(String(50), nullable=False) # Contact ke liye zaroori hai
    qualification = Column(String(255), nullable=True)
    institution = Column(String(255), nullable=True)
    teachers = Column(Text, nullable=True)
    is_salafi = Column(Boolean, default=False)
    
    # ==========================================================
    # 🎯 REQUEST DETAILS
    # ==========================================================
    purpose = Column(Text, nullable=True) 
    previous_work = Column(Text, nullable=True)
    
    # ==========================================================
    # ⚙️ STATUS & TRACKING (Future Proofing)
    # ==========================================================
    status = Column(String(50), default="pending", index=True) # pending, approved, rejected
    
    # Agar Admin reject kare to wajah yahan save hogi
    rejection_reason = Column(Text, nullable=True) 
    
    created_at = Column(DateTime, server_default=func.now())
    # Jab Admin approve/reject karega to ye time update hoga
    updated_at = Column(DateTime, onupdate=func.now()) 

    # ==========================================================
    # 🤝 RELATIONSHIPS
    # ==========================================================
    book = relationship("Book")
    user = relationship("User") # Isse hum User ka Email/Role access kar sakenge

    __table_args__ = {'mysql_engine': 'InnoDB'}