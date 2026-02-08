from sqlalchemy import Column, Integer, String, ForeignKey, func, TIMESTAMP, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

from .permission_model import role_permission_link


# ==========================================
# ROLE MODEL
# ==========================================
class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    users = relationship("User", back_populates="role")

    permissions = relationship(
        "Permission",
        secondary=role_permission_link,
        back_populates="roles"
    )

    __table_args__ = {"mysql_engine": "InnoDB"}


# ==========================================
# USER MODEL (FINAL)
# ==========================================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column("FullName", String(255), nullable=True)
    email = Column("Email", String(255), unique=True, nullable=False, index=True)
    username = Column("Username", String(100), unique=True, nullable=False, index=True)
    password_hash = Column("PasswordHash", String(255), nullable=False)

    date_joined = Column("DateJoined", DateTime, default=datetime.utcnow, nullable=False)
    status = Column("Status", String(50), default="Active")

    role_id = Column("RoleID", Integer, ForeignKey("roles.id"), nullable=False)
    role = relationship("Role", back_populates="users")

    otp_code = Column(String(6), nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)

    # ======================
    # FIXED RELATIONSHIPS
    # ======================

    logs = relationship(
        "Log",
        back_populates="user",
        foreign_keys="Log.user_id",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    issues = relationship(
        "Issue",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    # Access / Book Requests
    requests = relationship(
        "BookRequest",
        back_populates="user",
        foreign_keys="BookRequest.user_id",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    # Upload Requests (ONLY submitted_by)
    upload_requests = relationship(
        "UploadRequest",
        back_populates="submitted_by",
        foreign_keys="UploadRequest.submitted_by_id",
        lazy="selectin"
    )

    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    __table_args__ = {"mysql_engine": "InnoDB"}
