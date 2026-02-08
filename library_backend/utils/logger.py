from sqlalchemy.orm import Session
from datetime import datetime

# Models import karein (Ensure karein ke aapke pass Log model hai)
# Agar aapne models/__init__.py setup kiya hai to ye chalega,
# Warna: from models.log_model import Log
from models import log_model 

def create_log(db: Session, user, action_type: str, description: str, target_type: str = None, target_id: int = None):
    """
    Database mein audit log entry create karta hai.
    """
    try:
        new_log = log_model.Log(
            user_id=user.id if user else None,
            action_type=action_type,
            description=description,
            target_type=target_type,
            target_id=target_id,
            timestamp=datetime.utcnow()
        )
        db.add(new_log)
        db.flush() # ID generate karne ke liye, lekin commit main controller karega
        # Note: Hum yahan db.commit() nahi kar rahe taake main transaction ke sath hi save ho
    except Exception as e:
        print(f"Failed to create log: {str(e)}")