from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from auth import require_permission
from utils.cloudinary_helper import upload_to_cloudinary  # ✅ New Import

router = APIRouter()

# --- 1. IMAGE UPLOAD ---
@router.post("/image", dependencies=[Depends(require_permission("FILE_UPLOAD"))])
async def upload_image(file: UploadFile = File(...)):
    """
    Book cover image upload karta hai aur Cloudinary URL return karta hai.
    """
    # 1. Validation check (Security)
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, WEBP are allowed.")
    
    # 2. Upload to Cloudinary (Folder: covers)
    url = upload_to_cloudinary(file, folder="booknest/covers")
    
    # 3. Error Handling
    if not url:
        raise HTTPException(status_code=500, detail="Image upload failed on server.")
        
    # 4. Return URL (Frontend compatible)
    return {"url": url}


# --- 2. PDF UPLOAD ---
@router.post("/pdf", dependencies=[Depends(require_permission("FILE_UPLOAD"))])
async def upload_pdf(file: UploadFile = File(...)):
    """
    Book PDF upload karta hai aur Cloudinary URL return karta hai.
    """
    # 1. Validation check (Security)
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF is allowed.")
        
    # 2. Upload to Cloudinary (Folder: pdfs)
    url = upload_to_cloudinary(file, folder="booknest/pdfs")
    
    # 3. Error Handling
    if not url:
        raise HTTPException(status_code=500, detail="PDF upload failed on server.")
        
    # 4. Return URL (Frontend compatible)
    return {"url": url}