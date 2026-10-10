from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import json
import datetime

from ..database import get_db
from ..models import Farm, User, CropRecommendationHistory
from ..schemas import CropRecommendationRequest, CropRecommendationSaveRequest, CropCompareRequest
from ..services.crop_recommendation_service import crop_recommendation_service
from ..services.weather_service import WeatherService
from ..auth_helper import get_current_user

router = APIRouter(prefix="/api/crops", tags=["Crop Recommendation Intelligence"])
weather_service = WeatherService()


@router.get("/catalog")
def get_crop_catalog():
    """Returns the comprehensive agronomic crop database catalog."""
    return crop_recommendation_service.get_catalog()


@router.get("/catalog/{crop_id}")
def get_crop_catalog_detail(crop_id: str):
    """Returns detailed agronomic parameters and guidance for a single crop."""
    crop = crop_recommendation_service.get_crop_by_id(crop_id)
    if not crop:
        raise HTTPException(status_code=404, detail=f"Crop '{crop_id}' not found in catalog")
    return crop


@router.post("/recommend")
async def recommend_crops(
    req: CropRecommendationRequest,
    lang: str = Query("en"),
    x_user_phone: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Calculates explainable crop suitability rankings based on field characteristics,
    soil parameters, water availability, and live Open-Meteo weather data with regional localization.
    """
    lat = req.latitude or 16.5449
    lon = req.longitude or 81.5212
    soil_ph = req.soil_ph
    soil_type = req.soil_type or "Loamy"
    season = req.season or "Kharif"
    water_source = req.water_source or "Canal"
    village = req.village or "Bhimavaram"
    district = req.district or "West Godavari"

    # If farm_id provided, supplement with stored farm data
    if req.farm_id:
        farm = db.query(Farm).filter(Farm.id == req.farm_id).first()
        if farm:
            lat = farm.latitude or lat
            lon = farm.longitude or lon
            village = farm.village or village
            district = farm.district or district
            if soil_ph is None:
                soil_ph = farm.soil_ph
            if not req.soil_type:
                soil_type = farm.soil_type or soil_type
            if not req.water_source:
                water_source = farm.water_availability or water_source

    # Retrieve live Open-Meteo weather
    try:
        weather_data = await weather_service.get_farm_weather(
            lat=lat,
            lon=lon,
            village=village,
            district=district,
            language=lang
        )
    except Exception as e:
        weather_data = {
            "current_temp": 32.0,
            "min_temp": 24.0,
            "max_temp": 35.0,
            "humidity": 65,
            "wind_speed": 12,
            "forecast": []
        }

    recommendations = crop_recommendation_service.recommend_crops(
        soil_ph=soil_ph,
        soil_type=soil_type,
        season=season,
        water_source=water_source,
        weather=weather_data,
        nitrogen_kg_ha=req.nitrogen_kg_ha,
        phosphorus_kg_ha=req.phosphorus_kg_ha,
        potassium_kg_ha=req.potassium_kg_ha,
        preferred_category=req.preferred_category,
        language=lang
    )

    return {
        "farm_id": req.farm_id,
        "field_name": req.field_name or "Main Field",
        "location": f"{village}, {district}",
        "season": season,
        "soil_ph": soil_ph,
        "soil_type": soil_type,
        "water_source": water_source,
        "weather_snapshot": {
            "temperature": weather_data.get("current_temp", 32),
            "condition": weather_data.get("condition", "Partly Sunny"),
            "humidity": weather_data.get("humidity", 65),
            "rain_chance": weather_data.get("rain_chance", 10),
            "data_source": "Open-Meteo Weather API"
        },
        "total_crops_evaluated": len(recommendations),
        "recommendations": recommendations,
        "generated_at": datetime.datetime.utcnow().isoformat()
    }


@router.post("/compare")
def compare_crops(req: CropCompareRequest, db: Session = Depends(get_db)):
    """Compares 2 to 5 crops across agronomic parameters, water demand, and suitability."""
    if not req.crop_ids:
        raise HTTPException(status_code=400, detail="Please select at least 2 crops to compare")

    soil_ph = req.soil_ph
    soil_type = req.soil_type or "Loamy"
    season = req.season or "Kharif"
    water_source = req.water_source or "Canal"

    if req.farm_id:
        farm = db.query(Farm).filter(Farm.id == req.farm_id).first()
        if farm:
            if soil_ph is None:
                soil_ph = farm.soil_ph
            soil_type = farm.soil_type or soil_type
            water_source = farm.water_availability or water_source

    result = crop_recommendation_service.compare_crops(
        crop_ids=req.crop_ids,
        soil_ph=soil_ph,
        soil_type=soil_type,
        season=season,
        water_source=water_source
    )
    return result


@router.post("/recommend/save")
def save_crop_recommendation(
    req: CropRecommendationSaveRequest,
    x_user_phone: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Saves a generated crop recommendation plan into the database for the user."""
    user = get_current_user(db, x_user_phone, x_user_id)
    history_record = CropRecommendationHistory(
        user_id=user.id,
        farm_id=req.farm_id,
        season=req.season,
        field_name=req.field_name,
        inputs_json=json.dumps(req.inputs, default=str),
        recommendations_json=json.dumps(req.recommendations, default=str)
    )
    db.add(history_record)
    db.commit()
    db.refresh(history_record)
    return {
        "status": "success",
        "message": "Crop recommendation saved successfully",
        "id": history_record.id,
        "created_at": history_record.created_at.isoformat()
    }


@router.get("/recommend/history/{farm_id}")
def get_crop_recommendation_history(
    farm_id: int,
    x_user_phone: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Retrieves saved crop recommendation history for a farm."""
    user = get_current_user(db, x_user_phone, x_user_id)
    records = db.query(CropRecommendationHistory).filter(
        CropRecommendationHistory.farm_id == farm_id,
        CropRecommendationHistory.user_id == user.id
    ).order_by(CropRecommendationHistory.id.desc()).limit(10).all()

    formatted = []
    for r in records:
        try:
            inputs = json.loads(r.inputs_json)
        except Exception:
            inputs = {}
        try:
            recs = json.loads(r.recommendations_json)
        except Exception:
            recs = []
        formatted.append({
            "id": r.id,
            "field_name": r.field_name,
            "season": r.season,
            "inputs": inputs,
            "recommendations": recs,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })
    return formatted
