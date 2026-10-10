from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from ..models import User
from ..schemas import UserResponse
from ..auth_helper import get_current_user

router = APIRouter(prefix="/api/profile", tags=["Profile"])

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    preferred_language: Optional[str] = None

@router.get("", response_model=UserResponse)
def get_profile(
    x_user_phone: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user = get_current_user(db, x_user_phone, x_user_id)
    return user

@router.patch("", response_model=UserResponse)
def update_profile(
    data: ProfileUpdate,
    x_user_phone: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user = get_current_user(db, x_user_phone, x_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if data.name:
        user.name = data.name.strip()
    if data.preferred_language:
        user.preferred_language = data.preferred_language
    db.commit()
    db.refresh(user)
    return user
