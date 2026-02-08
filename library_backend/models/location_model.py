# library_backend/models/location_model.py
from sqlalchemy import Column, Integer, String, Text
from database import Base

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False)
    
    # In columns ko frontend ke mutabiq change karein ya schemas mein map karein
    rack = Column(String, nullable=True)   # room_name ki jagah 'rack' karein
    shelf = Column(String, nullable=True)  # shelf_number ki jagah 'shelf' karein
    section_name = Column(String, nullable=True)
    description = Column(Text, nullable=True)