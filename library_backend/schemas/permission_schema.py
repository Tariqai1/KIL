# file: schemas/permission_schema.py
from pydantic import BaseModel, Field
from typing import List, Optional

# --- 1. Permission Schema ---
class PermissionBase(BaseModel):
    name: str
    # ہم نے 'codename' کو ہٹا کر 'description' کر دیا ہے کیونکہ آپ کے ماڈل میں یہی نام ہے
    description: Optional[str] = None 

class PermissionCreate(PermissionBase):
    pass

class Permission(PermissionBase):
    id: int

    class Config:
        from_attributes = True

# --- 2. Role Schema ---
class RoleBase(BaseModel):
    name: str

class RoleCreate(RoleBase):
    pass

class Role(RoleBase):
    id: int

    class Config:
        from_attributes = True

# --- 3. Role with Permissions ---
class RoleWithPermissions(Role):
    # یہ وہ جگہ ہے جہاں غلطی ہو رہی تھی، اب یہ صحیح ڈیٹا لوڈ کرے گا
    permissions: List[Permission] = []

    class Config:
        from_attributes = True

# --- 4. Assign Permission Schema ---
class AssignPermissionsToRole(BaseModel):
    # یہاں 'min_items=1' ہٹا دیا ہے تاکہ اگر کوئی تمام پرمیشنز ختم کرنا چاہے تو ایرر نہ آئے
    permission_ids: List[int] = Field(default=[])