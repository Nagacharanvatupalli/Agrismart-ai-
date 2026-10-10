from fastapi import Header
from sqlalchemy.orm import Session
from typing import Optional
from .models import User

def get_current_user(
    db: Session,
    x_user_phone: Optional[str] = None,
    x_user_id: Optional[str] = None
) -> User:
    """
    Resolves the current authenticated farmer based on incoming request headers.
    If headers are absent, gracefully falls back to the most recent user.
    """
    if x_user_phone and str(x_user_phone).strip():
        clean_phone = str(x_user_phone).strip()
        user = db.query(User).filter(User.phone == clean_phone).first()
        if user:
            return user

    if x_user_id and str(x_user_id).strip():
        try:
            uid = int(x_user_id)
            user = db.query(User).filter(User.id == uid).first()
            if user:
                return user
        except (ValueError, TypeError):
            pass

    # Fallback to the latest user in database
    user = db.query(User).order_by(User.id.desc()).first()
    if not user:
        user = User(name="Farmer", phone="+919876543210", verified=True)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
