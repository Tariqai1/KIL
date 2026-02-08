import cloudinary
import cloudinary.uploader
import os
import shutil
from dotenv import load_dotenv
from fastapi import UploadFile

load_dotenv()

cloudinary.config( 
  cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"), 
  api_key = os.getenv("CLOUDINARY_API_KEY"), 
  api_secret = os.getenv("CLOUDINARY_API_SECRET"),
  secure = True
)

def upload_to_cloudinary(file: UploadFile, folder="library_uploads"):
    """
    Uploads large files to Cloudinary.
    FORCE 'raw' mode for large files to enable chunking and bypass 10MB limit.
    """
    if not file:
        return None
    
    # 1. Temporary filename
    temp_filename = f"temp_{file.filename}"
    
    try:
        print(f"🚀 PROCESSING: {file.filename}")

        # 2. Save to Disk (Safe buffering)
        with open(temp_filename, "wb") as buffer:
            file.file.seek(0)
            shutil.copyfileobj(file.file, buffer)
        
        # 3. Check File Size
        file_size = os.path.getsize(temp_filename)
        print(f"📊 Size: {file_size / (1024*1024):.2f} MB")

        # 4. Determine Resource Type (CRITICAL FIX)
        # Default is 'auto', BUT 'auto' treats PDFs as Images.
        # Images CANNOT be chunked. Images > 10MB fail on Free Plan.
        # So we MUST force 'raw' for any PDF or large file.
        res_type = "auto"
        
        if file.filename.lower().endswith(".pdf"):
             res_type = "raw"
             print("📄 PDF Detected -> Forcing 'raw' mode.")
        
        elif file_size > 10000000: # If > 10MB
             res_type = "raw"
             print("⚠️ Large File (>10MB) -> Forcing 'raw' mode to enable chunking.")

        print(f"📤 UPLOADING CHUNKS (Mode: {res_type})...")

        # 5. Upload Large (Chunked)
        response = cloudinary.uploader.upload_large(
            temp_filename, 
            folder=folder,
            resource_type=res_type, # This must be 'raw' for chunking to work!
            chunk_size=5242880      # 5MB Chunks (Safe size)
        )
        
        print("✅ UPLOAD SUCCESS")
        return response.get("secure_url")

    except Exception as e:
        print(f"❌ Cloudinary Upload Error: {e}")
        return None
        
    finally:
        # Cleanup
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
            print("🧹 Temp file cleaned")