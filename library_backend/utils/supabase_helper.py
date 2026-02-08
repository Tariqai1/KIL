import os
import uuid
from supabase import create_client, Client
from fastapi import UploadFile
from dotenv import load_dotenv

# Environment Variables Load karein
load_dotenv()

# Supabase Client Init
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

# Safety Check
if not url or not key:
    print("❌ Error: SUPABASE_URL or SUPABASE_KEY is missing in .env")
    supabase = None
else:
    supabase: Client = create_client(url, key)

def upload_pdf_to_supabase(file: UploadFile, bucket_name="library_db"):
    """
    Uploads PDF to Supabase Storage (Bucket: library_db) and returns Public URL.
    """
    if not file or not supabase:
        return None

    try:
        print(f"🚀 Uploading to Supabase: {file.filename}")

        if not file.filename.lower().endswith(".pdf"):
            print("❌ Only PDF files allowed")
            return None
                

        # 1. Unique Filename generate karein
        file_ext = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        # 2. File content read karein
        file.file.seek(0)
        file_content = file.file.read()
        
        # 3. Upload to Supabase
        # Note: Bucket name wahi hona chahiye jo aapne dashboard par banaya hai (library_db)
        response = supabase.storage.from_(bucket_name).upload(
            path=unique_filename,
            file=file_content,
            file_options={"content-type": "application/pdf", "upsert": "true"}
        )

        # 4. Get Public URL
        public_url = supabase.storage.from_(bucket_name).get_public_url(unique_filename)
        
        print(f"✅ Supabase Upload Success: {public_url}")
        return public_url

    except Exception as e:
        print(f"❌ Supabase Error: {e}")
        return None