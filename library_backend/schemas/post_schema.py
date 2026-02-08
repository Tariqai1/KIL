from pydantic import BaseModel ,Field
from datetime import datetime
from typing import Optional

# --- Shared Properties ---
class PostBase(BaseModel):
    title: str
    content: Optional[str] = None
    media_type: Optional[str] = "none" # 'image', 'pdf', 'none'

# --- For Response (Reading Data) ---
class PostResponse(PostBase):
    id: int
    file_url: Optional[str] = None
    created_at: datetime
    author_name: Optional[str] = "Markaz Admin" # Simplified author name

    class Config:
        from_attributes = True 

# Note: We don't need a "Create" schema here because 
# we will use "Form Data" (Multipart) in the controller 
# to handle file uploads + text together.from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Literal


# -----------------------------
# Shared Base Schema
# -----------------------------
class PostBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: Optional[str] = None

    # media_type allowed values
    media_type: Literal["image", "pdf", "none"] = "none"


# -----------------------------
# Response Schema (Read)
# -----------------------------
class PostResponse(PostBase):
    id: int
    file_url: Optional[str] = None
    created_at: datetime

    # Display author name (Public feed)
    author_name: str = "Markaz Admin"

    class Config:
        from_attributes = True

    @staticmethod
    def build_author_name(obj) -> str:
        """
        Safely build author name from relationship:
        obj.author could be None
        """
        try:
            if obj.author:
                # priority: full_name > username > email
                if getattr(obj.author, "full_name", None):
                    return obj.author.full_name
                if getattr(obj.author, "username", None):
                    return obj.author.username
                if getattr(obj.author, "email", None):
                    return obj.author.email
        except Exception:
            pass

        return "Markaz Admin"
