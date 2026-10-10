from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Farm
from ..services.weather_service import weather_service

router = APIRouter(tags=["Weather"])

@router.get("/api/weather")
async def get_direct_weather(
    lat: float = 16.54,
    lon: float = 81.51,
    village: str = "Bhimavaram",
    district: str = "West Godavari",
    state: str = "Andhra Pradesh",
    lang: str = Query("en")
):
    return await weather_service.get_farm_weather(
        lat=lat,
        lon=lon,
        village=village,
        district=district,
        state=state,
        language=lang
    )

@router.get("/api/farms/{farm_id}/weather")
async def get_farm_weather(farm_id: int, lang: str = Query("en"), db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    data = await weather_service.get_farm_weather(
        lat=farm.latitude,
        lon=farm.longitude,
        village=farm.village,
        district=farm.district,
        state=farm.state,
        language=lang
    )
    data["farm_id"] = farm.id
    data["farm_name"] = farm.farm_name
    return data
