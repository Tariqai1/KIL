from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests
from sqlalchemy.orm import Session
import secrets # Random username ke liye

# --- Imports (Apne project ke hisaab se check karein) ---
from database import get_db
from models import user_model  # User aur Role dono models chahiye
from auth import create_access_token

router = APIRouter()

GOOGLE_CLIENT_ID = "158248986174-cv22ngbp9ctjlf0dmditmsre151lpqm9.apps.googleusercontent.com"

class GoogleLoginRequest(BaseModel):
    token: str

@router.post("/auth/google")
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    try:
        # 1. Google Token Verify karein
        info = id_token.verify_oauth2_token(
            payload.token,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )

        email = info.get("email")
        full_name = info.get("name") or ""

        if not email:
            raise HTTPException(status_code=400, detail="Google account email not found")

        # 2. Check karein User pehle se hai ya nahi
        user = db.query(user_model.User).filter(user_model.User.email == email).first()

        if not user:
            # --- NEW USER LOGIC ---
            
            # A. Default Role Dhundhein (e.g., 'Student' ya 'Member')
            default_role = db.query(user_model.Role).filter(user_model.Role.name == "Student").first()
            
            # Agar 'Student' role nahi mila, to fallback karein
            if not default_role:
                default_role = db.query(user_model.Role).first() # Jo bhi pehla role ho wo le lo
                if not default_role:
                    raise HTTPException(status_code=500, detail="No roles found in system. Please contact admin.")

            # B. Unique Username Generate karein
            base_username = email.split("@")[0]
            username = base_username
            counter = 1
            # Check karein ke username duplicate na ho
            while db.query(user_model.User).filter(user_model.User.username == username).first():
                username = f"{base_username}{counter}"
                counter += 1

            # C. Create User Object (Sab fields ke sath)
            user = user_model.User(
                username=username,
                email=email,
                full_name=full_name,
                status="Active",
                role_id=default_role.id,  # ✅ Zaroori hai
                password_hash="GOOGLE_OAUTH_LOGIN_NO_PASSWORD" # ✅ Placeholder password zaroori hai
            )

            db.add(user)
            db.commit()
            db.refresh(user)

        # 3. Access Token Generate karein
        # Role ko handle karein (string ya object)
        role_name = user.role.name if user.role else "User"
        
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email, "role": role_name}
        )

        # 4. Permissions List Fetch karein (Frontend ke liye zaroori)
        permissions_list = [p.name for p in user.role.permissions] if user.role and user.role.permissions else []

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "role": {"name": role_name}, # Frontend structure match karein
                "permissions": permissions_list # ✅ Permissions bhejna zaroori hai
            }
        }

    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")
    except Exception as e:
        # Debugging ke liye error print karein
        print(f"Error: {str(e)}") 
        raise HTTPException(status_code=500, detail=f"Google login failed: {str(e)}")