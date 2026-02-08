from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func # ✅ func add kiya case-insensitive check ke liye

# --- Imports ---
from models import book_model, user_model, book_permission_model, request_user_model
from schemas import book_schema
from auth import get_current_user_optional 
from database import get_db

router = APIRouter()

# --- Helper: Get Book Internal ---
def get_book_by_id_internal(db: Session, book_id: int):
    return db.query(book_model.Book).options(
        joinedload(book_model.Book.subcategories).joinedload(book_model.Subcategory.category),
        joinedload(book_model.Book.language)
    ).filter(
        book_model.Book.id == book_id,
        book_model.Book.deleted_at.is_(None)
    ).first()

# ==================================
# READ OPERATIONS (Public & Admin)
# ==================================

@router.get("/", response_model=List[book_schema.Book])
def read_books(
    skip: int = 0, 
    limit: int = 100,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    language_id: Optional[int] = None,
    approved_only: bool = False,
    db: Session = Depends(get_db),
    current_user: Optional[user_model.User] = Depends(get_current_user_optional)
):
    print("\n" + "="*50)
    print("🔍 DEBUG: Searching Books...")
    
    if current_user:
        print(f"👤 User Logged In: {current_user.username} (ID: {current_user.id})")
    else:
        print("👤 Guest User (Not Logged In)")

    # 1. Fetch Books
    query = db.query(book_model.Book).options(
        joinedload(book_model.Book.subcategories).joinedload(book_model.Subcategory.category),
        joinedload(book_model.Book.language)
    ).filter(book_model.Book.deleted_at.is_(None))
    
    # Filters
    if approved_only:
        query = query.filter(book_model.Book.is_approved == True)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                book_model.Book.title.ilike(search_term),
                book_model.Book.author.ilike(search_term),
                book_model.Book.isbn.ilike(search_term)
            )
        )

    if category_id:
        query = query.filter(book_model.Book.subcategories.any(id=category_id))
    
    if language_id:
        query = query.filter(book_model.Book.language_id == language_id)
        
    books = query.order_by(book_model.Book.id.desc()).offset(skip).limit(limit).all()

    # =========================================================
    # ✅ LOGIC: User Access Permission Check (DEBUGGED)
    # =========================================================
    
    accessible_book_ids = set()

    if current_user:
        # A. Check Direct Permissions
        direct_perms = db.query(book_permission_model.BookPermission).filter(
            book_permission_model.BookPermission.user_id == current_user.id
        ).all()
        accessible_book_ids.update([p.book_id for p in direct_perms])

        # B. Check Approved Requests (Case Insensitive Fix)
        try:
            # 🔍 Debug: User ki saari requests print karo
            all_reqs = db.query(request_user_model.AccessRequest).filter(
                request_user_model.AccessRequest.user_id == current_user.id
            ).all()
            
            print(f"📋 Total Requests found for user: {len(all_reqs)}")
            for req in all_reqs:
                print(f"   - Book ID: {req.book_id} | Status in DB: '{req.status}'")

            # ✅ FIX: Case Insensitive Check (Approved, approved, APPROVED sab chalega)
            approved_reqs = db.query(request_user_model.AccessRequest).filter(
                request_user_model.AccessRequest.user_id == current_user.id,
                func.lower(request_user_model.AccessRequest.status) == "approved"
            ).all()
            
            found_ids = [req.book_id for req in approved_reqs]
            accessible_book_ids.update(found_ids)
            print(f"✅ Approved Book IDs found: {found_ids}")

        except Exception as e:
            print(f"❌ Error fetching requests: {e}")

    # Step 2: Set Flag
    for book in books:
        has_access = False

        if not book.is_restricted:
            has_access = True
        elif current_user and hasattr(current_user, 'role') and current_user.role.name.lower() in ['admin', 'superadmin']:
            has_access = True
        elif current_user and book.id in accessible_book_ids:
            has_access = True
            print(f"🔓 Unlocking Restricted Book ID: {book.id} for User")

        setattr(book, "user_has_access", has_access)

    print("="*50 + "\n")
    return books


@router.get("/{book_id}", response_model=book_schema.Book)
def read_book(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[user_model.User] = Depends(get_current_user_optional)
):
    db_book = get_book_by_id_internal(db, book_id)
    
    if not db_book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    # 1. Approval Check
    if not db_book.is_approved:
        if not current_user or (current_user.role.name.lower() not in ['admin', 'superadmin']):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found.")
            
    # 2. Restricted Access Check Logic
    has_access = False

    if not db_book.is_restricted:
        has_access = True
    elif current_user and hasattr(current_user, 'role') and current_user.role.name.lower() in ['admin', 'superadmin']:
        has_access = True
    elif current_user:
        # Check Permission Table
        perm = db.query(book_permission_model.BookPermission).filter(
            book_permission_model.BookPermission.book_id == book_id,
            book_permission_model.BookPermission.user_id == current_user.id
        ).first()
        
        # Check Request Table (Case Insensitive)
        req = db.query(request_user_model.AccessRequest).filter(
            request_user_model.AccessRequest.book_id == book_id,
            request_user_model.AccessRequest.user_id == current_user.id,
            func.lower(request_user_model.AccessRequest.status) == "approved"
        ).first()

        if perm or req:
            has_access = True

    if db_book.is_restricted and not has_access:
         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to view this restricted book.")

    setattr(db_book, "user_has_access", has_access)
    return db_book