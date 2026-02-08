import os

def delete_static_file(file_path: str):
    """
    Deletes a file from the filesystem if it exists.
    """
    if not file_path:
        return

    try:
        # Agar path me "static/" shuru me hai to usay handle karein
        # (Depend karta hai aap DB me path kaise save kar rahe hain)
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"File deleted successfully: {file_path}")
        else:
            # Agar relative path hai (e.g., 'static/uploads/...')
            # to current directory se check karein
            full_path = os.path.abspath(file_path)
            if os.path.exists(full_path):
                os.remove(full_path)
                print(f"File deleted successfully: {full_path}")
            else:
                print(f"File not found for deletion: {file_path}")
                
    except Exception as e:
        print(f"Error deleting file {file_path}: {str(e)}")