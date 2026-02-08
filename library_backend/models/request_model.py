from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLAlchemyEnum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from datetime import datetime


# ==========================================================
# UPLOAD REQUEST MODEL
# ==========================================================
class UploadRequest(Base):
    __tablename__ = "upload_requests"

    id = Column(Integer, primary_key=True, index=True)

    submitted_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"), nullable=False, unique=True)

    status = Column(
        SQLAlchemyEnum("Pending", "Approved", "Rejected", name="upload_status_enum"),
        default="Pending",
        nullable=False
    )

    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)
    remarks = Column(String(500), nullable=True)

    # ✅ EXPLICIT RELATIONSHIPS
    submitted_by = relationship(
        "User",
        foreign_keys=[submitted_by_id],
        back_populates="upload_requests"
    )

    reviewed_by = relationship(
        "User",
        foreign_keys=[reviewed_by_id]
    )

    book = relationship(
        "Book",
        back_populates="upload_request",
        uselist=False
    )

    __table_args__ = {"mysql_engine": "InnoDB"}


# ==========================================================
# BOOK ACCESS REQUEST MODEL (USER)
# ==========================================================
class BookRequest(Base):
    __tablename__ = "book_requests"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"), nullable=False)

    request_reason = Column(Text, nullable=False)
    delivery_address = Column(Text, nullable=False)
    contact_number = Column(String(20), nullable=True)

    requested_days = Column(Integer, default=7)

    status = Column(String(50), default="Pending", index=True)
    rejection_reason = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    # ✅ FIXED RELATIONSHIPS
    user = relationship(
        "User",
        back_populates="requests",
        foreign_keys=[user_id]
    )

    book = relationship(
        "Book",
        back_populates="requests"
    )

    __table_args__ = {"mysql_engine": "InnoDB"}
