from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from database import Base

class DonationInfo(Base):
    __tablename__ = "donation_info"

    id = Column(Integer, primary_key=True, index=True)
    
    # --- 1. QR CODE (Desktop & Mobile) ---
    qr_code_desktop = Column(String, nullable=True)
    qr_code_mobile  = Column(String, nullable=True)
    
    # --- 2. APPEAL (Desktop & Mobile) ---
    appeal_desktop = Column(String, nullable=True)
    appeal_mobile  = Column(String, nullable=True)
    
    # --- 3. BANK DETAILS (Desktop & Mobile) ---
    bank_desktop = Column(String, nullable=True)
    bank_mobile  = Column(String, nullable=True)

    # Timestamp (Track kab update hua)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<DonationInfo id={self.id}>"
