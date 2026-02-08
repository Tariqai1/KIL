from pydantic import BaseModel
from typing import Optional

class LocationBase(BaseModel):
    name: str
    rack: Optional[str] = None
    shelf: Optional[str] = None

class LocationCreate(LocationBase):
    pass

class Location(LocationBase):
    id: int

    class Config:
        from_attributes = True # SQLAlchemy se data fetch karne ke liye zaroori hai