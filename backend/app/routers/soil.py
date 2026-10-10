from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import datetime
from ..database import get_db
from ..models import Farm, SoilRecord, SavedItem, Crop
from ..schemas import SoilPHUpdate
from ..services.gemini_ai import gemini_ai_service
from ..services.weather_service import weather_service
from ..services.soil_service import soil_service

router = APIRouter(prefix="/api/farms", tags=["Soil"])

class LocationSpec(BaseModel):
    farm_id: Optional[int] = None
    location_name: str
    village: str
    district: str
    state: Optional[str] = "Andhra Pradesh"
    latitude: float = 16.5449
    longitude: float = 81.5212
    soil_ph: float = 6.5
    land_type: str = "Clay Loam"
    water_source: str = "Canal Water"
    crop_type: str = "Paddy"

class SoilCompareRequest(BaseModel):
    user_id: Optional[int] = 1
    location_a: LocationSpec
    location_b: LocationSpec

@router.get("/{farm_id}/soil")
async def get_farm_soil(
    farm_id: int,
    crop_type: Optional[str] = Query("Paddy"),
    compare_farm_id: Optional[int] = Query(None),
    refresh: Optional[bool] = Query(False),
    lang: Optional[str] = Query("en"),
    db: Session = Depends(get_db)
):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    if farm.soil_ph is None:
        return {
            "farm_id": farm.id,
            "farm_name": farm.farm_name,
            "village": farm.village,
            "district": farm.district,
            "soil_ph": None,
            "has_ph": False,
            "message": "Enter your manual soil pH (e.g., 6.5) to unlock AI Soil Intelligence and crop recommendations."
        }

    # Fetch live weather data for this location
    weather_data = await weather_service.get_farm_weather(
        lat=farm.latitude,
        lon=farm.longitude,
        village=farm.village,
        district=farm.district,
        state=farm.state,
        language=lang or "en"
    )

    effective_crop = farm.current_crops or crop_type or "Paddy"

    # 1. Check if AI soil analysis is already stored in the DB for this farm and current pH (unless refresh requested or non-english requested)
    analysis = None
    if not refresh and (not lang or lang == "en"):
        saved = (
            db.query(SavedItem)
            .filter(SavedItem.farm_id == farm.id, SavedItem.item_type == "soil_intelligence")
            .order_by(SavedItem.id.desc())
            .first()
        )

        if saved and saved.metadata_json and isinstance(saved.metadata_json, dict):
            cached_ph = saved.metadata_json.get("ph")
            cached_crop = saved.metadata_json.get("target_crop")
            if cached_ph is not None and abs(float(cached_ph) - float(farm.soil_ph)) < 0.05 and (not crop_type or cached_crop == effective_crop):
                analysis = dict(saved.metadata_json)
                analysis["farm_id"] = farm.id
                analysis["farm_name"] = farm.farm_name
                analysis["village"] = farm.village
                analysis["district"] = farm.district
                analysis["has_ph"] = True
                analysis["stored_in_db"] = True
                analysis["source"] = "database"
                analysis["weather_data"] = {
                    "temp": weather_data.get("current_temp", 32),
                    "condition": weather_data.get("condition", "Partly Sunny"),
                    "rain_chance": weather_data.get("rain_chance", 15),
                    "humidity": weather_data.get("humidity", 65)
                }

    # 2. Not cached or refresh requested -> Call Gemini AI Soil Intelligence with exact farm details
    if not analysis:
        ai_res = await gemini_ai_service.generate_soil_intelligence(
            ph=farm.soil_ph,
            soil_type=farm.soil_type or "Loamy",
            water_availability=farm.water_availability or "Moderate",
            farm_context={
                "village": farm.village,
                "district": farm.district,
                "state": farm.state,
                "farm_name": farm.farm_name
            },
            weather_data=weather_data,
            crop_type=effective_crop,
            water_source=farm.irrigation_method or "Canal Water",
            language=lang or "en"
        )

        now_str = datetime.datetime.utcnow().strftime("%d %b %Y")
        analysis = {
            "farm_id": farm.id,
            "farm_name": farm.farm_name,
            "village": farm.village,
            "district": farm.district,
            "has_ph": True,
            "ph": farm.soil_ph,
            "ph_category": ai_res.get("ph_category", "Optimal Neutral"),
            "ph_status": ai_res.get("ph_status", "Optimal neutral soil pH (highly suitable for most crops)"),
            "health_score": ai_res.get("health_score", 88),
            "target_crop": ai_res.get("target_crop", crop_type),
            "target_crop_suitability": ai_res.get("target_crop_suitability", "Highly Suitable"),
            "ai_summary": ai_res.get("ai_summary", f"Soil pH of {farm.soil_ph} provides healthy nutrient balance."),
            "weather_soil_impact": ai_res.get("weather_soil_impact", f"Current weather maintains adequate moisture in {farm.soil_type or 'Loamy'} soil."),
            "water_source_impact": ai_res.get("water_source_impact", f"{farm.irrigation_method or 'Canal Water'} keeps soil salinity balanced."),
            "nutrient_absorption": ai_res.get("nutrient_absorption", {
                "nitrogen": "Optimal (85%)",
                "phosphorus": "High (80%)",
                "potassium": "Optimal (90%)",
                "micronutrients": "Adequate"
            }),
            "amendments": ai_res.get("amendments", [
                "Apply 2-3 tons of farmyard manure (FYM) per acre annually.",
                "Conduct split application of nitrogen to minimize leaching loss."
            ]),
            "last_updated": farm.soil_ph_updated_at.strftime("%d %b %Y") if farm.soil_ph_updated_at else now_str,
            "stored_in_db": True,
            "source": "ai_generated",
            "weather_data": {
                "temp": weather_data.get("current_temp", 32),
                "condition": weather_data.get("condition", "Partly Sunny"),
                "rain_chance": weather_data.get("rain_chance", 15),
                "humidity": weather_data.get("humidity", 65)
            },
            "farm_factors": {
                "soil_type": farm.soil_type or "Loamy",
                "water_availability": farm.water_availability or "Moderate",
                "water_source": farm.irrigation_method or "Canal Water",
                "crop_type": crop_type,
                "recent_rainfall": farm.recent_rainfall or "42 mm (last 30 days)",
                "season": farm.current_season or "Kharif (Jun - Sep)",
                "past_crops": farm.previous_crops or "Paddy, Maize",
                "recent_fertilizers": farm.recent_fertilizers or "Urea, DAP"
            },
            "guidance": ai_res.get("guidance", []),
            "recommended_crops": ai_res.get("crops", [])
        }

        # Store AI report into Database (saved_items)
        try:
            saved_item = SavedItem(
                user_id=farm.user_id,
                farm_id=farm.id,
                item_type="soil_intelligence",
                title=f"AI Soil Intelligence (pH {farm.soil_ph}) - {farm.farm_name}",
                content=analysis["ai_summary"],
                metadata_json=analysis
            )
            db.add(saved_item)
            db.commit()
        except Exception as e:
            db.rollback()

    # If side-by-side comparison requested with another farm
    if compare_farm_id and compare_farm_id != farm.id:
        farm_b = db.query(Farm).filter(Farm.id == compare_farm_id).first()
        if farm_b and farm_b.soil_ph is not None:
            w_b = await weather_service.get_farm_weather(farm_b.latitude, farm_b.longitude, farm_b.village, farm_b.district, farm_b.state)
            ai_b = await gemini_ai_service.generate_soil_intelligence(
                ph=farm_b.soil_ph,
                soil_type=farm_b.soil_type or "Loamy",
                water_availability=farm_b.water_availability or "Moderate",
                farm_context={"village": farm_b.village, "district": farm_b.district, "state": farm_b.state, "farm_name": farm_b.farm_name},
                weather_data=w_b,
                crop_type=crop_type,
                water_source=farm_b.irrigation_method or "Borewell"
            )
            comp_res = await gemini_ai_service.generate_soil_comparison(
                location_a={
                    "location_name": farm.farm_name,
                    "village": farm.village,
                    "district": farm.district,
                    "soil_ph": farm.soil_ph,
                    "land_type": farm.soil_type or "Loamy",
                    "water_source": farm.irrigation_method or "Canal Water",
                    "crop_type": crop_type,
                    "weather_desc": f"{weather_data.get('current_temp', 32)}°C, {weather_data.get('condition', 'Partly Sunny')}"
                },
                location_b={
                    "location_name": farm_b.farm_name,
                    "village": farm_b.village,
                    "district": farm_b.district,
                    "soil_ph": farm_b.soil_ph,
                    "land_type": farm_b.soil_type or "Loamy",
                    "water_source": farm_b.irrigation_method or "Borewell",
                    "crop_type": crop_type,
                    "weather_desc": f"{w_b.get('current_temp', 32)}°C, {w_b.get('condition', 'Partly Sunny')}"
                }
            )
            analysis["side_by_side"] = {
                "compare_farm_id": farm_b.id,
                "compare_farm_name": farm_b.farm_name,
                "compare_farm_analysis": ai_b,
                "comparison": comp_res
            }

    return analysis

@router.post("/soil/compare")
async def compare_side_by_side_locations(payload: SoilCompareRequest, db: Session = Depends(get_db)):
    """Runs and stores side-by-side comparative soil intelligence for two locations based on weather, pH, land type, water source, and crop type."""
    loc_a = payload.location_a
    loc_b = payload.location_b

    # Fetch live weather for both coordinates
    w_a = await weather_service.get_farm_weather(loc_a.latitude, loc_a.longitude, loc_a.village, loc_a.district, loc_a.state or "Andhra Pradesh")
    w_b = await weather_service.get_farm_weather(loc_b.latitude, loc_b.longitude, loc_b.village, loc_b.district, loc_b.state or "Andhra Pradesh")

    # Generate individual reports
    ai_a = await gemini_ai_service.generate_soil_intelligence(
        ph=loc_a.soil_ph,
        soil_type=loc_a.land_type,
        farm_context={"village": loc_a.village, "district": loc_a.district, "farm_name": loc_a.location_name},
        weather_data=w_a,
        crop_type=loc_a.crop_type,
        water_source=loc_a.water_source
    )

    ai_b = await gemini_ai_service.generate_soil_intelligence(
        ph=loc_b.soil_ph,
        soil_type=loc_b.land_type,
        farm_context={"village": loc_b.village, "district": loc_b.district, "farm_name": loc_b.location_name},
        weather_data=w_b,
        crop_type=loc_b.crop_type,
        water_source=loc_b.water_source
    )

    # Format weather descriptions
    desc_a = f"{w_a.get('current_temp', 32)}°C, {w_a.get('condition', 'Partly Sunny')}, {w_a.get('rain_chance', 10)}% rain"
    desc_b = f"{w_b.get('current_temp', 32)}°C, {w_b.get('condition', 'Partly Sunny')}, {w_b.get('rain_chance', 10)}% rain"

    # Generate comparison
    comp_res = await gemini_ai_service.generate_soil_comparison(
        location_a={
            "location_name": loc_a.location_name,
            "village": loc_a.village,
            "district": loc_a.district,
            "soil_ph": loc_a.soil_ph,
            "land_type": loc_a.land_type,
            "water_source": loc_a.water_source,
            "crop_type": loc_a.crop_type,
            "weather_desc": desc_a
        },
        location_b={
            "location_name": loc_b.location_name,
            "village": loc_b.village,
            "district": loc_b.district,
            "soil_ph": loc_b.soil_ph,
            "land_type": loc_b.land_type,
            "water_source": loc_b.water_source,
            "crop_type": loc_b.crop_type,
            "weather_desc": desc_b
        }
    )

    result = {
        "location_a": {
            **loc_a.dict(),
            "weather": {
                "temp": w_a.get("current_temp", 32),
                "condition": w_a.get("condition", "Partly Sunny"),
                "rain_chance": w_a.get("rain_chance", 10),
                "humidity": w_a.get("humidity", 65)
            },
            "analysis": ai_a
        },
        "location_b": {
            **loc_b.dict(),
            "weather": {
                "temp": w_b.get("current_temp", 32),
                "condition": w_b.get("condition", "Partly Sunny"),
                "rain_chance": w_b.get("rain_chance", 10),
                "humidity": w_b.get("humidity", 65)
            },
            "analysis": ai_b
        },
        "comparison": comp_res,
        "created_at": datetime.datetime.utcnow().isoformat(),
        "stored_in_db": True
    }

    # Store comparison report in database
    try:
        saved_item = SavedItem(
            user_id=payload.user_id or 1,
            farm_id=loc_a.farm_id,
            item_type="soil_comparison",
            title=f"Side-by-Side Soil Analysis: {loc_a.location_name} vs {loc_b.location_name}",
            content=comp_res.get("comparative_summary", "Comparative soil and weather analysis"),
            metadata_json=result
        )
        db.add(saved_item)
        db.commit()
    except Exception as e:
        db.rollback()

    return result

@router.put("/{farm_id}/soil")
async def update_farm_soil_ph(farm_id: int, payload: SoilPHUpdate, db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    if payload.soil_ph < 0.0 or payload.soil_ph > 14.0:
        raise HTTPException(status_code=400, detail="Soil pH must be between 0.0 and 14.0")

    farm.soil_ph = payload.soil_ph
    farm.soil_ph_updated_at = datetime.datetime.utcnow()

    # 1. Create historical soil record
    soil_rec = SoilRecord(
        farm_id=farm.id,
        ph=payload.soil_ph,
        measurement_source=payload.measurement_source or "Manual Entry",
        notes="Manual soil pH entered by farmer in Soil Intelligence"
    )
    db.add(soil_rec)

    # Synchronize soil_ph on any crops assigned to this farm
    try:
        crops = db.query(Crop).filter(Crop.farm_id == farm.id).all()
        for c in crops:
            c.soil_ph = payload.soil_ph
    except Exception:
        pass

    db.commit()
    db.refresh(farm)

    # 2. Fetch live weather
    weather_data = await weather_service.get_farm_weather(
        lat=farm.latitude,
        lon=farm.longitude,
        village=farm.village,
        district=farm.district,
        state=farm.state
    )

    # 3. Generate updated AI Soil Intelligence Report
    ai_res = await gemini_ai_service.generate_soil_intelligence(
        ph=farm.soil_ph,
        soil_type=farm.soil_type or "Loamy",
        water_availability=farm.water_availability or "Moderate",
        farm_context={
            "village": farm.village,
            "district": farm.district,
            "state": farm.state,
            "farm_name": farm.farm_name
        },
        weather_data=weather_data,
        crop_type=farm.current_crops or "Paddy",
        water_source=farm.irrigation_method or "Canal Water"
    )

    now_str = datetime.datetime.utcnow().strftime("%d %b %Y")
    analysis = {
        "farm_id": farm.id,
        "farm_name": farm.farm_name,
        "village": farm.village,
        "district": farm.district,
        "has_ph": True,
        "ph": farm.soil_ph,
        "ph_category": ai_res.get("ph_category", "Optimal Neutral"),
        "ph_status": ai_res.get("ph_status", "Optimal neutral soil pH (highly suitable for most crops)"),
        "health_score": ai_res.get("health_score", 88),
        "target_crop": ai_res.get("target_crop", farm.current_crops or "Paddy"),
        "target_crop_suitability": ai_res.get("target_crop_suitability", "Highly Suitable"),
        "ai_summary": ai_res.get("ai_summary", f"Soil pH of {farm.soil_ph} provides healthy nutrient balance."),
        "weather_soil_impact": ai_res.get("weather_soil_impact", "Weather conditions support balanced nutrient absorption."),
        "water_source_impact": ai_res.get("water_source_impact", "Water source maintains steady root moisture."),
        "nutrient_absorption": ai_res.get("nutrient_absorption", {
            "nitrogen": "Optimal (85%)",
            "phosphorus": "High (80%)",
            "potassium": "Optimal (90%)",
            "micronutrients": "Adequate"
        }),
        "amendments": ai_res.get("amendments", [
            "Apply 2-3 tons of farmyard manure (FYM) per acre annually.",
            "Conduct split application of nitrogen to minimize leaching loss."
        ]),
        "last_updated": now_str,
        "stored_in_db": True,
        "source": "ai_generated",
        "weather_data": {
            "temp": weather_data.get("current_temp", 32),
            "condition": weather_data.get("condition", "Partly Sunny"),
            "rain_chance": weather_data.get("rain_chance", 15),
            "humidity": weather_data.get("humidity", 65)
        },
        "farm_factors": {
            "soil_type": farm.soil_type or "Loamy",
            "water_availability": farm.water_availability or "Moderate",
            "water_source": farm.irrigation_method or "Canal Water",
            "crop_type": farm.current_crops or "Paddy",
            "recent_rainfall": farm.recent_rainfall or "42 mm (last 30 days)",
            "season": farm.current_season or "Kharif (Jun - Sep)",
            "past_crops": farm.previous_crops or "Paddy, Maize",
            "recent_fertilizers": farm.recent_fertilizers or "Urea, DAP"
        },
        "guidance": ai_res.get("guidance", []),
        "recommended_crops": ai_res.get("crops", [])
    }

    # 4. Save AI report into Database (saved_items)
    try:
        saved_item = SavedItem(
            user_id=farm.user_id,
            farm_id=farm.id,
            item_type="soil_intelligence",
            title=f"AI Soil Intelligence (pH {farm.soil_ph}) - {farm.farm_name}",
            content=analysis["ai_summary"],
            metadata_json=analysis
        )
        db.add(saved_item)
        db.commit()
    except Exception as e:
        db.rollback()

    return analysis
