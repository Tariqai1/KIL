import sys
import os
from database import SessionLocal
from models import user_model
from auth import create_access_token, verify_password, get_user_from_token, SECRET_KEY, ALGORITHM
from jose import jwt

# Setup
db = SessionLocal()

def debug_login_flow(username):
    print(f"\n🔍 --- DEBUGGING USER: {username} ---")
    
    # 1. Check User in DB
    user = db.query(user_model.User).filter(user_model.User.username == username).first()
    if not user:
        print("❌ ERROR: User not found in Database!")
        return
    print(f"✅ User Found: ID={user.id}, Role={user.role.name if user.role else 'No Role'}, Status={user.status}")

    # 2. Generate Token
    print("\n🔑 Generating Token...")
    try:
        data = {"sub": user.username, "id": user.id}
        token = create_access_token(data)
        print(f"✅ Token Generated: {token[:20]}... (Hidden)")
    except Exception as e:
        print(f"❌ ERROR Creating Token: {e}")
        return

    # 3. Decode Token (Manually)
    print("\n🔓 Decoding Token (Verification)...")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"✅ Token Decoded Successfully: {payload}")
    except Exception as e:
        print(f"❌ ERROR Decoding Token (Key Mismatch?): {e}")
        print(f"   -> Check your SECRET_KEY in .env and auth.py")
        return

    # 4. Simulate 'get_current_user' logic
    print("\n🕵️ Simulating Backend Auth Check...")
    try:
        username_from_token = payload.get("sub")
        if username_from_token != username:
            print(f"❌ Username Mismatch! Token has {username_from_token}")
        else:
            print("✅ Username Matches.")
            
        if user.status != "Active":
            print("❌ User Status is NOT Active.")
        else:
            print("✅ User Status is Active.")
            
    except Exception as e:
        print(f"❌ Error in Logic: {e}")

    print("\n🎉 RESULT: Agar upar sab Green tick ✅ hain, to Backend OK hai. Masla Frontend me hai.")

if __name__ == "__main__":
    # Yahan wo username likhein jis se aap login kar rahe hain
    debug_login_flow("admin")