from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field, model_validator
from datetime import datetime, timedelta
import random
import secrets

# --- Imports ---
from database import get_db
from models import user_model
from utils.email_service import send_otp_email
from auth import get_password_hash # Password hash karne ke liye

router = APIRouter()

# --- Schemas (Input Validation) ---

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8)
    confirm_password: str

    @model_validator(mode='after')
    def check_passwords_match(self):
        if self.new_password != self.confirm_password:
            raise ValueError('Passwords do not match')
        return self

# ==========================================
# 1. SEND OTP ENDPOINT
# ==========================================
@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # 1. User check karein
    user = db.query(user_model.User).filter(user_model.User.email == request.email).first()
    
    if not user:
        # Security: User nahi mila to bhi 200 OK bhejte hain taake hackers ko pata na chale
        # Lekin development ke liye hum 404 de sakte hain.
        raise HTTPException(status_code=404, detail="User with this email not found")

    # 2. OTP Generate karein (6 Digit)
    otp = str(random.randint(100000, 999999))
    
    # 3. Database me Save karein
    user.otp_code = otp
    user.otp_expires_at = datetime.utcnow() + timedelta(minutes=10) # 10 minute validity
    db.commit()

    # 4. Email Bhejein
    email_sent = send_otp_email(user.email, otp)
    
    if not email_sent:
        raise HTTPException(status_code=500, detail="Failed to send email. Please try again later.")

    return {"message": "OTP sent successfully to your email"}

# ==========================================
# 2. VERIFY OTP & RESET PASSWORD ENDPOINT
# ==========================================
@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    # 1. User Dhoondhein
    user = db.query(user_model.User).filter(user_model.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. OTP Check Karein
    if not user.otp_code or user.otp_code != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # 3. Expiry Check Karein
    if user.otp_expires_at and datetime.utcnow() > user.otp_expires_at:
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    # 4. Password Update Karein
    user.password_hash = get_password_hash(request.new_password)
    
    # 5. OTP Clean karein (Taake dobara use na ho sake)
    user.otp_code = None
    user.otp_expires_at = None
    
    db.commit()
    
    return {"message": "Password reset successfully. You can now login."}