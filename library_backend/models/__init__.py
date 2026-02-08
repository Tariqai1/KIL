# models/__init__.py
from database import Base

# Import all models here so Alembic/SQLAlchemy can find them
from .user_model import User, Role
from .book_model import Book, Category, Subcategory
from .language_model import Language
from .location_model import Location  # <--- Ye file ab mil jayegi
from .request_model import BookRequest, UploadRequest
from .issue_model import Issue # Agar Issue model ban chuka hai to
from .donation_models import DonationInfo