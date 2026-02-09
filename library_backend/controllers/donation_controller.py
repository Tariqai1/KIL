from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session
from database import get_db
# Ensure these imports work based on your folder structure
from models.donation_model import DonationInfo 
from schemas.donation_schema import DonationInfoResponse
from utils.cloudinary_helper import upload_to_cloudinary

# ✅ Router Initialize (Prefix hataya kyunki main.py me already hai)
router = APIRouter()

# ============================================================
# 1. GET Donation Info (Public)
# ============================================================
@router.get("/", response_model=DonationInfoResponse)
def get_donation_details(db: Session = Depends(get_db)):
    info = db.query(DonationInfo).first()
    
    # Agar record nahi hai, to naya bana dein (Empty)
    if not info:
        info = DonationInfo()
        db.add(info)
        db.commit()
        db.refresh(info)
        
    return info

# ============================================================
# 2. UPDATE Donation Info (Admin Panel - Cloudinary Support)
# ============================================================
@router.put("/update")
async def update_donation_details(
    # --- Desktop Files ---
    qr_code_desktop: UploadFile = File(None),
    appeal_desktop: UploadFile = File(None),
    bank_desktop: UploadFile = File(None),
    
    # --- Mobile Files ---
    qr_code_mobile: UploadFile = File(None),
    appeal_mobile: UploadFile = File(None),
    bank_mobile: UploadFile = File(None),
    
    db: Session = Depends(get_db)
):
    # 1. Database se record nikalein
    info = db.query(DonationInfo).first()
    if not info:
        info = DonationInfo()
        db.add(info)

    # 2. Helper Function to Upload & Update
    async def process_upload(file_obj, folder_name="library_donation"):
        if file_obj and file_obj.filename:
            print(f"Uploading {file_obj.filename} to Cloudinary...")
            # Ensure read/seek is handled if using async
            url = upload_to_cloudinary(file_obj.file, folder=folder_name)
            return url
        return None

    # --- 3. Uploading Images (One by one check) ---
    
    # QR Codes
    if qr_code_desktop:
        url = await process_upload(qr_code_desktop)
        if url: info.qr_code_desktop = url
        
    if qr_code_mobile:
        url = await process_upload(qr_code_mobile)
        if url: info.qr_code_mobile = url

    # Appeal Images
    if appeal_desktop:
        url = await process_upload(appeal_desktop)
        if url: info.appeal_desktop = url
        
    if appeal_mobile:
        url = await process_upload(appeal_mobile)
        if url: info.appeal_mobile = url

    # Bank Details
    if bank_desktop:
        url = await process_upload(bank_desktop)
        if url: info.bank_desktop = url
        
    if bank_mobile:
        url = await process_upload(bank_mobile)
        if url: info.bank_mobile = url

    # 4. Save to Database
    db.commit()
    db.refresh(info)
    
    return {"message": "Donation details updated successfully!", "data": info}
