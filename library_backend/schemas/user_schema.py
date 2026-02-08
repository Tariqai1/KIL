from pydantic import BaseModel, EmailStr, Field, model_validator
from typing import Optional, List
from datetime import datetime

# ==========================================
# 0. PERMISSION SCHEMA (Helper)
# ==========================================
class PermissionOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

# ==========================================
# 1. ROLE SCHEMAS
# ==========================================

class RoleBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=50)
    description: Optional[str] = Field(None, max_length=255)

class RoleCreate(RoleBase):
    pass

class RoleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=50)
    description: Optional[str] = Field(None, max_length=255)

# ✅ MAIN FIX IS HERE
class Role(RoleBase):
    id: int
    # 👇 Ye line sabse zaroori hai. Iske bina "Manager" ka data frontend tak nahi pahuchega.
    permissions: List[PermissionOut] = [] 
    
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# ==========================================
# 2. USER BASE SCHEMAS
# ==========================================

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = Field(None, max_length=100)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    role_id: Optional[int] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=100)
    role_id: Optional[int] = None
    status: Optional[str] = None

class UserMeUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=100)

class ChangePasswordSchema(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str

    @model_validator(mode='after')
    def check_passwords_match(self):
        pw1 = self.new_password
        pw2 = self.confirm_password
        if pw1 is not None and pw2 is not None and pw1 != pw2:
            raise ValueError('New password and confirmation password do not match.')
        return self

# ==========================================
# 3. USER RESPONSE SCHEMA
# ==========================================

class UserResponse(UserBase):
    id: int
    status: str = "Active"
    
    # Nested Role (Ab isme permissions bhi hongi)
    role: Optional[Role] = None 
    
    # Flattened Permissions (For Login/Auth Context)
    permissions: List[str] = []

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    date_joined: Optional[datetime] = None 

    class Config:
        from_attributes = True

# Alias
User = UserResponse

class UserProfile(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    email: EmailStr

    class Config:
        from_attributes = True