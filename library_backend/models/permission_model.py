from sqlalchemy import Column, Integer, String, ForeignKey, Table, TIMESTAMP, DateTime, func
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

# Junction Table for Many-to-Many relationship between Roles and Permissions
role_permission_link = Table(
    'role_permissions',
    Base.metadata,
    Column('role_id', Integer, ForeignKey('roles.id', ondelete="CASCADE"), primary_key=True),
    Column('permission_id', Integer, ForeignKey('permissions.id', ondelete="CASCADE"), primary_key=True),
    mysql_engine='InnoDB'
)

class Permission(Base):
    __tablename__ = 'permissions'
    
    id = Column(Integer, primary_key=True)
    # name: Unique identifier for the permission (e.g., 'USER_MANAGE')
    name = Column(String(100), unique=True, nullable=False, index=True)
    # description: Human-readable explanation of what the permission does
    description = Column(String(255), nullable=True)
    
    # Relationships
    roles = relationship("Role", secondary=role_permission_link, back_populates="permissions")

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    __table_args__ = {'mysql_engine': 'InnoDB'}