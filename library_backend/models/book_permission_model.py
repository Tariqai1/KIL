# file: models/book_permission_model.py
from sqlalchemy import Column, Integer, ForeignKey, DateTime, func
from database import Base
from datetime import datetime

class BookPermission(Base):
    __tablename__ = 'book_permissions'
    
    id = Column(Integer, primary_key=True)
    book_id = Column(Integer, ForeignKey('books.id', ondelete="CASCADE"), nullable=False)
    
    # --- YAHAN BADLAV KIYA GAYA HAI ---
    # 'users.ClientID' ko 'users.id' kar diya gaya hai
    user_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=True)
    
    role_id = Column(Integer, ForeignKey('roles.id', ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    __table_args__ = {'mysql_engine': 'InnoDB'}