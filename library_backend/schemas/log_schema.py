# file: schemas/log_schema.py

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .user_schema import User


class Log(BaseModel):
    id: int
    timestamp: datetime
    action_type: str

    # ✅ Added (Frontend me ID show hoga)
    action_by_id: Optional[int] = None

    target_type: Optional[str] = None
    target_id: Optional[int] = None
    description: Optional[str] = None

    # ✅ joinedload se user object bhi aayega
    action_by: Optional[User] = None

    class Config:
        from_attributes = True
