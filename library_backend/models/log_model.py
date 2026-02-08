# file: models/log_model.py

from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from database import Base


class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # user related to record (optional)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # user who performed the action
    action_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    timestamp = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    action_type = Column(String(100), nullable=False)
    target_type = Column(String(50), nullable=True)
    target_id = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)

    # 🔹 Action performer
    action_by = relationship(
        "User",
        foreign_keys=[action_by_id],
        lazy="joined"
    )

    # 🔹 Related user (owner)
    user = relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="logs",
        lazy="selectin"
    )

    def __repr__(self):
        return (
            f"<Log id={self.id} action_type={self.action_type} "
            f"action_by_id={self.action_by_id}>"
        )
