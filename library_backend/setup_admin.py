import os
import sys
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# 1. Load Env (Zaroori hai taake Secret Key sahi load ho)
load_dotenv()

# 2. Path Setup
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), '.')))

# 3. Imports
from database import SessionLocal
from auth import get_password_hash
from models.user_model import User, Role
from models.permission_model import Permission

def setup_initial_data():
    """
    Creates Roles (Admin, Student, Editor, Manager), Permissions,
    and a Default Super Admin User.
    """
    db: Session = SessionLocal()
    print("🚀 Connecting to database...")

    try:
        # ==========================================
        # 1. DEFINE ROLES & PERMISSIONS
        # ==========================================
        
        # A. All Roles List
        roles_to_create = ["Admin", "Student", "Editor", "Manager", "Member"]
        
        # B. All Permissions List
        all_permissions = [
            # User & Role Management
            'USER_VIEW', 'USER_MANAGE', 
            'ROLE_VIEW', 'ROLE_MANAGE', 'ROLE_PERMISSION_ASSIGN',
            'PERMISSION_VIEW', 'PERMISSION_MANAGE',
            
            # Book Management
            'BOOK_VIEW', 'BOOK_MANAGE', 'BOOK_ISSUE', 
            'CATEGORY_MANAGE', 'LANGUAGE_MANAGE', 
            'LOCATION_MANAGE', 'COPY_MANAGE', 'COPY_VIEW',
            
            # Requests & Circulation
            'REQUEST_CREATE', 'REQUEST_VIEW', 'REQUEST_APPROVE', 'REQUEST_MANAGE',
            'ISSUE_VIEW',
            
            # System & Logs
            'LOG_VIEW', 'FILE_UPLOAD', 'DIGITAL_ACCESS_VIEW',
            'BOOK_PERMISSION_MANAGE', 'BOOK_PERMISSION_VIEW'
        ]

        # ==========================================
        # 2. CREATE PERMISSIONS
        # ==========================================
        print(f"🛠  Checking {len(all_permissions)} permissions...")
        existing_perms = {p.name for p in db.query(Permission).all()}
        
        new_perms = []
        for name in all_permissions:
            if name not in existing_perms:
                new_perms.append(Permission(name=name))
        
        if new_perms:
            db.add_all(new_perms)
            db.commit()
            print(f"✅ Added {len(new_perms)} new permissions.")
        else:
            print("✅ All permissions already exist.")

        # Reload all permissions map for assignment
        all_perms_map = {p.name: p for p in db.query(Permission).all()}

        # ==========================================
        # 3. CREATE ROLES & ASSIGN PERMISSIONS
        # ==========================================
        print("👤 Checking Roles...")
        
        for role_name in roles_to_create:
            role = db.query(Role).filter(Role.name == role_name).first()
            if not role:
                role = Role(name=role_name)
                db.add(role)
                db.commit()
                db.refresh(role)
                print(f"   + Created Role: {role_name}")
            else:
                print(f"   - Role exists: {role_name}")
            
            # --- Permission Assignment Logic ---
            perms_to_assign = []
            
            if role_name == "Admin":
                # Admin gets EVERYTHING
                perms_to_assign = list(all_perms_map.values())
            
            elif role_name == "Manager":
                # Manager gets most things except system configs
                allowed = ['BOOK_MANAGE', 'BOOK_ISSUE', 'USER_VIEW', 'REQUEST_APPROVE', 'REQUEST_MANAGE', 'LOG_VIEW']
                perms_to_assign = [all_perms_map[p] for p in allowed if p in all_perms_map]

            elif role_name == "Editor":
                # Editor manages books only
                allowed = ['BOOK_MANAGE', 'BOOK_VIEW', 'CATEGORY_MANAGE', 'BOOK_ISSUE']
                perms_to_assign = [all_perms_map[p] for p in allowed if p in all_perms_map]

            elif role_name in ["Student", "Member"]:
                # Students can only view books and make requests
                allowed = ['BOOK_VIEW', 'REQUEST_CREATE', 'REQUEST_VIEW']
                perms_to_assign = [all_perms_map[p] for p in allowed if p in all_perms_map]

            # Update Role Permissions
            role.permissions = perms_to_assign
            db.commit()

        # ==========================================
        # 4. CREATE / FIX ADMIN USER
        # ==========================================
        print("🔑 Checking Admin User...")
        admin_role = db.query(Role).filter(Role.name == "Admin").first()
        admin_user = db.query(User).filter(User.username == "admin").first()
        
        # Password hardcoded for recovery
        new_password = "admin" 
        hashed_pw = get_password_hash(new_password)

        if admin_user:
            # Update existing admin (Fixes 401 Error)
            admin_user.password_hash = hashed_pw
            admin_user.role_id = admin_role.id
            admin_user.status = "Active"
            print("✅ Admin user updated (Password reset to 'admin')")
        else:
            # Create new admin
            admin_user = User(
                username="admin",
                email="admin@library.com",
                full_name="Super Administrator",
                password_hash=hashed_pw,
                role_id=admin_role.id,
                status="Active"
            )
            db.add(admin_user)
            print("✅ Admin user created.")

        db.commit()
        print("\n🎉 SETUP COMPLETE! You can login with:")
        print(f"👉 Username: admin")
        print(f"👉 Password: {new_password}")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    setup_initial_data()