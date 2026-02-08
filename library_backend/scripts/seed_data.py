# library_backend/scripts/seed_data.py
import sys
import os

# Path setup taaki models aur database access ho sake
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models.book_model import Category, Subcategory
from models.language_model import Language

def seed_everything():
    db = SessionLocal()
    try:
        # 1. Add Professional Languages
        languages = ["English", "Urdu", "Arabic", "Hindi", "Persian"]
        print("Seeding Languages...")
        for lang_name in languages:
            exists = db.query(Language).filter(Language.name == lang_name).first()
            if not exists:
                db.add(Language(name=lang_name))
        
        # 2. Add Professional Categories & Subcategories
        # 
        data = {
            "Islamic Studies": ["Quran", "Hadith", "Fiqh", "Seerat-un-Nabi", "History of Islam"],
            "Literature": ["Fiction", "Poetry", "Essays", "Drama", "Classical Literature"],
            "Science & Tech": ["Computer Science", "Physics", "Mathematics", "Biology", "Engineering"],
            "Social Sciences": ["Political Science", "Sociology", "Psychology", "Economics"],
            "Children's Books": ["Stories", "Educational", "Picture Books", "Moral Stories"],
            "Reference": ["Dictionaries", "Encyclopedias", "Yearbooks", "Reports"]
        }

        print("Seeding Categories and Subcategories...")
        for cat_name, sub_list in data.items():
            # Category check
            db_cat = db.query(Category).filter(Category.name == cat_name).first()
            if not db_cat:
                db_cat = Category(name=cat_name, description=f"Books related to {cat_name}")
                db.add(db_cat)
                db.commit()
                db.refresh(db_cat)
            
            # Subcategories check
            for sub_name in sub_list:
                db_sub = db.query(Subcategory).filter(Subcategory.name == sub_name).first()
                if not db_sub:
                    db.add(Subcategory(name=sub_name, category_id=db_cat.id))
        
        db.commit()
        print("✅ Database Seeded Successfully!")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_everything()