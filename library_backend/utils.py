# file: utils.py

from typing import Optional, List
import aiofiles
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session

from models import log_model, user_model


# ==========================================================
# ✅ LOGGING UTILITY (UPDATED BEST)
# ==========================================================

def create_log(
    db: Session,
    user: Optional[user_model.User],
    action_type: str,
    description: str,
    target_type: Optional[str] = None,
    target_id: Optional[int] = None,
    flush: bool = True,
):
    """
    ✅ Creates a log entry in DB.
    Fixes:
    - action_by_id properly saved
    - user_id optional support
    - safe description length
    """

    try:
        # Safe description length
        max_desc_length = 1000
        if description and len(description) > max_desc_length:
            description = description[: max_desc_length - 3] + "..."

        log_entry = log_model.Log(
            # ✅ main fix (frontend me username + id show karega)
            action_by_id=user.id if user else None,

            # optional extra mapping
            user_id=user.id if user else None,

            action_type=action_type,
            description=description,
            target_type=target_type,
            target_id=target_id,
        )

        db.add(log_entry)

        if flush:
            db.flush()

        return log_entry

    except Exception as e:
        # Logging should NEVER crash main flow
        print(f"⚠️ create_log() failed: {e}")
        return None


# ==========================================================
# ✅ FILE HANDLING UTILITIES (same as your code)
# ==========================================================

STATIC_DIR = Path("static")


async def save_upload_file(
    upload_file: UploadFile,
    destination: str,
    allowed_content_types: Optional[List[str]] = None
) -> Optional[str]:

    if not upload_file or not upload_file.filename:
        return None

    if allowed_content_types and upload_file.content_type not in allowed_content_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type: {upload_file.content_type}"
        )

    file_location: Optional[Path] = None

    try:
        dest_path = STATIC_DIR / destination
        dest_path.mkdir(parents=True, exist_ok=True)

        file_extension = Path(upload_file.filename).suffix.lower()

        disallowed_extensions = [
            ".php", ".sh", ".exe", ".bat", ".html", ".js", ".vbs", ".py", ".rb"
        ]
        if file_extension in disallowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Disallowed file extension: {file_extension}"
            )

        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_location = dest_path / unique_filename

        bytes_written = 0
        max_file_size = 50 * 1024 * 1024  # 50MB

        async with aiofiles.open(file_location, "wb") as out_file:
            while content := await upload_file.read(1024 * 1024):
                if bytes_written + len(content) > max_file_size:
                    file_location.unlink(missing_ok=True)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="File too large"
                    )

                await out_file.write(content)
                bytes_written += len(content)

        return f"/static/{destination}/{unique_filename}"

    except HTTPException as http_exc:
        raise http_exc

    except Exception as e:
        print(f"❌ Error saving file: {e}")

        if file_location and file_location.exists():
            try:
                file_location.unlink()
            except Exception:
                pass

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save file."
        )

    finally:
        await upload_file.close()


def delete_static_file(relative_url: Optional[str]):
    if not relative_url or not relative_url.startswith("/static/"):
        return

    try:
        file_path_relative_to_static = relative_url.lstrip("/static/")
        absolute_file_path = (STATIC_DIR / file_path_relative_to_static).resolve()

        if absolute_file_path.is_file():
            absolute_file_path.unlink()

    except Exception as e:
        print(f"⚠️ delete_static_file failed: {e}")
