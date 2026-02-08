# file: controllers/log_controller.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from models import log_model
from schemas import log_schema
from auth import require_permission, get_db

router = APIRouter()


@router.get(
    "/",
    response_model=List[log_schema.Log],
    dependencies=[Depends(require_permission("LOG_VIEW"))]
)
def get_logs(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = None,
    action_type: Optional[str] = None,
    target_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    ✅ System logs list
    Filters:
    - user_id (action_by_id)
    - action_type
    - target_type
    Pagination:
    - skip, limit
    """

    query = (
        db.query(log_model.Log)
        .options(joinedload(log_model.Log.action_by))  # ✅ FIX: action_by user load
        .order_by(log_model.Log.timestamp.desc())
    )

    # ✅ Filter: user_id (action_by_id)
    if user_id:
        query = query.filter(log_model.Log.action_by_id == user_id)

    # ✅ Filter: action_type
    if action_type:
        query = query.filter(log_model.Log.action_type == action_type)

    # ✅ Filter: target_type
    if target_type:
        query = query.filter(log_model.Log.target_type == target_type)

    logs = query.offset(skip).limit(limit).all()
    return logs
