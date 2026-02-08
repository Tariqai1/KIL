from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base

class MarkazPost(Base):
    __tablename__ = "markaz_posts"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)

    # Content Fields
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)

    # ✅ NEW: Tags Column Added
    tags = Column(String(255), nullable=True)

    # Media Fields
    # allowed: "image", "pdf", "none"
    media_type = Column(String(20), nullable=False, default="none")
    file_url = Column(String(500), nullable=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Author Link (Admin who posted)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # ✅ lazy="joined" is kept (Best for performance)
    author = relationship("User", lazy="joined")

    __table_args__ = {"mysql_engine": "InnoDB"}

    def __repr__(self):
        return f"<MarkazPost id={self.id} title='{self.title}'>" 