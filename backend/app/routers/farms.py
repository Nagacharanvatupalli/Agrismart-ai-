from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from ..database import get_db
from ..models import Farm, User
from ..schemas import FarmCreate, FarmUpdate, FarmResponse
from ..auth_helper import get_current_user

router = APIRouter(prefix="/api/farms", tags=["Farms"])

@router.get("", response_model=List[FarmResponse])
def get_farms(
    x_user_phone: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user = get_current_user(db, x_user_phone, x_user_id)
    farms = db.query(Farm).filter(Farm.user_id == user.id).all()
    return farms

@router.post("", response_model=FarmResponse)
def create_farm(
    farm_in: FarmCreate,
    x_user_phone: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user = get_current_user(db, x_user_phone, x_user_id)
    farm = Farm(
        user_id=user.id,
        farm_name=farm_in.farm_name,
        acreage=farm_in.acreage,
        latitude=farm_in.latitude,
        longitude=farm_in.longitude,
        pincode=farm_in.pincode,
        village=farm_in.village,
        mandal=farm_in.mandal or farm_in.village,
        district=farm_in.district,
        state=farm_in.state or "Andhra Pradesh",
        survey_number=farm_in.survey_number,
        soil_ph=farm_in.soil_ph,
        soil_type=farm_in.soil_type or "Loamy",
        water_availability=farm_in.water_availability or "Moderate",
        current_crops=farm_in.current_crops or "Paddy"
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm

@router.get("/{farm_id}", response_model=FarmResponse)
def get_farm(farm_id: int, db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    return farm

@router.patch("/{farm_id}", response_model=FarmResponse)
def update_farm(farm_id: int, farm_in: FarmUpdate, db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    update_data = farm_in.model_dump(exclude_unset=True)
    if "soil_ph" in update_data and update_data["soil_ph"] is not None:
        farm.soil_ph_updated_at = datetime.datetime.utcnow()

    for key, value in update_data.items():
        setattr(farm, key, value)

    db.commit()
    db.refresh(farm)
    return farm

@router.delete("/{farm_id}")
def delete_farm(farm_id: int, db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    db.delete(farm)
    db.commit()
    return {"message": "Farm parcel deleted successfully", "id": farm_id}

@router.get("/{farm_id}/insights")
async def get_farm_insights(farm_id: int, db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        # Fallback parcel context if farm_id not found
        farm_context = {
            "farm_name": "Bhimavaram Farm",
            "village": "Bhimavaram",
            "district": "West Godavari",
            "state": "Andhra Pradesh",
            "acreage": 2.5,
            "soil_ph": 6.8,
            "current_crops": "Paddy"
        }
    else:
        farm_context = {
            "farm_name": farm.farm_name,
            "village": farm.village,
            "district": farm.district,
            "state": farm.state,
            "acreage": farm.acreage,
            "soil_ph": farm.soil_ph or 6.8,
            "current_crops": farm.current_crops or "Paddy"
        }

    from ..services.gemini_ai import gemini_ai_service
    ai_insights = await gemini_ai_service.generate_farm_insights(farm_context)

    return {
        "farm_id": farm_id,
        "farm_name": farm_context["farm_name"],
        "village": farm_context["village"],
        "acreage": farm_context["acreage"],
        "soil_ph": farm_context["soil_ph"],
        "current_crop": farm_context["current_crops"],
        "insights": ai_insights
    }

