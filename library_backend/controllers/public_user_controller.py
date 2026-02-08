from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import user_model
from schemas import user_schema
from auth import get_password_hash

# Note: Yahan humne koi 'get_current_user' dependency nahi lagayi
router = APIRouter()

@router.post("/register", response_model=user_schema.UserResponse, status_code=status.HTTP_201_CREATED)
def register_public_user(user: user_schema.UserCreate, db: Session = Depends(get_db)):
    """
    Public Registration:
    - Koi bhi naya user yahan account bana sakta hai.
    - Token ki zaroorat nahi hai.
    - Default Role 'Member' milega.
    """
    # 1. Check Duplicates (Email)
    if db.query(user_model.User).filter(user_model.User.email == user.email).first():
        raise HTTPException(status_code=409, detail="Email is already registered")
    
    # 2. Check Duplicates (Username)
    if db.query(user_model.User).filter(user_model.User.username == user.username).first():
        raise HTTPException(status_code=409, detail="Username is already taken")

    # 3. Get Default Role ('Member')
    default_role = db.query(user_model.Role).filter(user_model.Role.name == "Member").first()
    
    # Safety Check: Agar Member role DB mein nahi hai to pehla role utha lo
    if not default_role:
        default_role = db.query(user_model.Role).first()
        # Safety Check: Agar ab bhi koi role na mile to error do
        if not default_role:
             raise HTTPException(status_code=500, detail="System Error: No roles found. Contact Admin.")

    # 4. Create User
    hashed_pwd = get_password_hash(user.password)
    
    new_user = user_model.User(
        email=user.email,
        username=user.username,
        password_hash=hashed_pwd,
        full_name=user.full_name,
        role_id=default_role.id,
        status="Active"
    )
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")