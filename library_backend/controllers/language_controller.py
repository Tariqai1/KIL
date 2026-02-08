# file: controllers/language_controller.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func # Needed for count
from typing import List
from models import language_model, user_model, book_model # Import book_model
from schemas import language_schema
from auth import require_permission, get_db
from utils import create_log

router = APIRouter()

# --- CREATE ---
@router.post("/", response_model=language_schema.Language, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_permission("LANGUAGE_MANAGE"))])
def create_language(
    language: language_schema.LanguageCreate,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(require_permission("LANGUAGE_MANAGE"))
):
    """Creates a new language."""
    if db.query(language_model.Language).filter(language_model.Language.name == language.name).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Language with this name already exists")

    new_language = language_model.Language(**language.dict())
    db.add(new_language)
    create_log(db, current_user, "LANGUAGE_CREATED", f"Language '{language.name}' created.")
    db.commit()
    db.refresh(new_language)
    return new_language

# --- READ ALL (Public) ---
@router.get("/", response_model=List[language_schema.Language])
def read_languages(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Fetches a list of all languages."""
    return db.query(language_model.Language).offset(skip).limit(limit).all()

# --- READ ONE (Public) ---
@router.get("/{language_id}", response_model=language_schema.Language)
def read_language(language_id: int, db: Session = Depends(get_db)):
    """Fetches details of a specific language by ID."""
    db_language = db.query(language_model.Language).filter(language_model.Language.id == language_id).first()
    if db_language is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Language not found")
    return db_language

# --- UPDATE ---
@router.put("/{language_id}", response_model=language_schema.Language, dependencies=[Depends(require_permission("LANGUAGE_MANAGE"))])
def update_language(
    language_id: int,
    language_update: language_schema.LanguageCreate, # Use LanguageCreate schema for updates
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(require_permission("LANGUAGE_MANAGE"))
):
    """Updates an existing language."""
    db_language = db.query(language_model.Language).filter(language_model.Language.id == language_id).first()
    if db_language is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Language not found")

    # Check if the new name conflicts with another existing language
    if language_update.name != db_language.name and \
       db.query(language_model.Language).filter(language_model.Language.name == language_update.name).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Another language with this name already exists")

    # Update fields
    db_language.name = language_update.name
    db_language.description = language_update.description

    create_log(db, current_user, "LANGUAGE_UPDATED", f"Language ID {language_id} updated to '{language_update.name}'.")
    db.commit()
    db.refresh(db_language)
    return db_language

# --- DELETE ---
@router.delete("/{language_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_permission("LANGUAGE_MANAGE"))])
def delete_language(
    language_id: int,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(require_permission("LANGUAGE_MANAGE"))
):
    """Deletes a language."""
    db_language = db.query(language_model.Language).filter(language_model.Language.id == language_id).first()
    if db_language is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Language not found")

    # --- Check if language is associated with any books ---
    book_count = db.query(func.count(book_model.Book.id)).filter(book_model.Book.language_id == language_id).scalar()
    if book_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete language: It is associated with {book_count} book(s)."
        )
    # --- End check ---

    language_name = db_language.name # Get name for logging before deleting
    db.delete(db_language)
    create_log(db, current_user, "LANGUAGE_DELETED", f"Language '{language_name}' (ID: {language_id}) deleted.")
    db.commit()
    # No content to return for 204
    return None