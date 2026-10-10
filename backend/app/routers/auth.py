from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import bcrypt
from ..database import get_db
from ..models import User, Farm
from ..schemas import OTPRequest, OTPVerifyRequest, LoginRequest, UserResponse

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# ── Password hashing (bcrypt direct — avoids passlib compatibility issues) ─────
def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

# ── OTP send (simulated) ───────────────────────────────────────────────────────
@router.post("/send-otp")
def send_otp(request: OTPRequest, db: Session = Depends(get_db)):
    """Simulates sending an OTP to the farmer's mobile number."""
    return {"message": f"OTP sent to {request.phone}. Use 123456 in dev mode.", "status": "success"}

# ── Sign-up / first-time registration ─────────────────────────────────────────
@router.post("/verify", response_model=UserResponse)
def verify_otp(request: OTPVerifyRequest, db: Session = Depends(get_db)):
    """
    Registers a new user OR updates an existing one.
    If a 'password' is provided, it is hashed and stored.
    Existing users can only have their name updated here (not re-set password).
    """
    phone = request.phone.strip()
    user = db.query(User).filter(User.phone == phone).first()

    if not user:
        # New user — create account
        new_user = User(
            name=request.name.strip() if request.name else "Farmer",
            phone=phone,
            verified=True,
            preferred_language=request.preferred_language or "en",
            password_hash=hash_password(request.password) if request.password else None
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    else:
        # Existing user — update name if provided
        changed = False
        if request.name and request.name.strip() and user.name != request.name.strip():
            user.name = request.name.strip()
            changed = True
        # Allow setting/updating password if none exists yet
        if request.password and not user.password_hash:
            user.password_hash = hash_password(request.password)
            changed = True
        if changed:
            db.commit()
            db.refresh(user)
        return user

# ── Password-based login (returning users) ────────────────────────────────────
@router.post("/login-password", response_model=UserResponse)
def login_with_password(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates an existing user using phone number + password.
    Returns 401 if credentials are wrong or user does not exist.
    """
    phone = request.phone.strip()
    user = db.query(User).filter(User.phone == phone).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No account found with this phone number. Please sign up first."
        )

    if not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account has no password set. Please sign up again with a password."
        )

    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please try again."
        )

    return user

# ── Legacy alias ──────────────────────────────────────────────────────────────
@router.post("/login", response_model=UserResponse)
def login_user(request: OTPVerifyRequest, db: Session = Depends(get_db)):
    """Legacy direct login/registration endpoint (no password check)."""
    return verify_otp(request, db)

# ── Get current user by phone header ─────────────────────────────────────────
@router.get("/me", response_model=UserResponse)
def get_current_user(phone: str = "+919876543210", db: Session = Depends(get_db)):
    """Fetches the current authenticated user (development shortcut)."""
    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        user = User(name="Farmer", phone=phone, verified=True, preferred_language="en")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
