from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import json
import datetime

from ..database import get_db
from ..models import Farm, User, IrrigationPlanHistory, IrrigationEventRecord, SensorReadingRecord
from ..schemas import IrrigationPlanCalculateRequest, IrrigationEventCreate, SensorReadingCreate
from ..services.irrigation_service import irrigation_service
from ..services.weather_service import WeatherService
from ..auth_helper import get_current_user

router = APIRouter(prefix="/api/irrigation", tags=["Smart Irrigation"])
weather_service = WeatherService()


@router.post("/plan")
async def calculate_irrigation_plan(
    req: IrrigationPlanCalculateRequest,
    lang: str = Query("en"),
    x_user_phone: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Generates a full FAO-56 Penman-Monteith crop evapotranspiration, water-balance,
    and scheduled irrigation requirement plan integrating live Open-Meteo weather with regional localization.
    """
    farm = None
    lat = 16.5449
    lon = 81.5212
    acreage = req.area or 2.5
    soil_type = req.soil_type or "Loamy"
    water_source = req.water_source or "Canal"
    village = "Bhimavaram"
    district = "West Godavari"

    if req.farm_id:
        farm = db.query(Farm).filter(Farm.id == req.farm_id).first()
        if farm:
            lat = farm.latitude or lat
            lon = farm.longitude or lon
            acreage = farm.acreage if req.area is None or req.area <= 0 else req.area
            soil_type = farm.soil_type or soil_type
            water_source = farm.water_availability or water_source
            village = farm.village or village
            district = farm.district or district

    # Fetch live Open-Meteo weather
    try:
        weather_data = await weather_service.get_farm_weather(
            lat=lat,
            lon=lon,
            village=village,
            district=district,
            language=lang
        )
    except Exception:
        weather_data = {
            "current_temp": 32.0,
            "min_temp": 24.0,
            "max_temp": 34.0,
            "humidity": 65,
            "wind_speed": 12,
            "forecast": []
        }

    # Fetch latest sensor reading if available
    measured_moisture = req.measured_soil_moisture_percent
    if measured_moisture is None and req.farm_id:
        last_sensor = db.query(SensorReadingRecord).filter(
            SensorReadingRecord.farm_id == req.farm_id
        ).order_by(SensorReadingRecord.id.desc()).first()
        if last_sensor:
            measured_moisture = last_sensor.moisture_percent

    plan = irrigation_service.calculate_plan(
        crop=req.crop,
        acreage=acreage,
        water_source=water_source,
        stage=req.growth_stage,
        soil_type=soil_type,
        irrigation_method=req.irrigation_method,
        application_efficiency=req.application_efficiency,
        pump_flow_rate_m3_hr=req.pump_flow_rate_m3_hr or 30.0,
        measured_soil_moisture=measured_moisture,
        weather=weather_data,
        language=lang
    )

    plan["farm_id"] = req.farm_id
    plan["farm_name"] = farm.farm_name if farm else "Main Farm"
    plan["village"] = village
    plan["district"] = district

    # Auto-persist generated plan into DB history if user is resolved
    try:
        user = get_current_user(db, x_user_phone, x_user_id)
        if farm:
            plan_record = IrrigationPlanHistory(
                user_id=user.id,
                farm_id=farm.id,
                crop_name=req.crop,
                growth_stage=plan["growth_stage"],
                irrigation_method=plan["irrigation_method"],
                net_depth_mm=plan["net_depth_mm"],
                gross_depth_mm=plan["gross_depth_mm"],
                water_volume_m3=plan["water_volume_m3"],
                next_irrigation_date=plan["next_date"],
                plan_json=json.dumps(plan, default=str)
            )
            db.add(plan_record)
            db.commit()
            plan["saved_plan_id"] = plan_record.id
    except Exception:
        pass

    return plan


@router.get("/forecast/{farm_id}")
async def get_irrigation_forecast(
    farm_id: int,
    crop: str = "Paddy",
    growth_stage: str = "Vegetative Stage",
    db: Session = Depends(get_db)
):
    """
    Returns a 7-day projected irrigation and evapotranspiration outlook
    driven by live daily Open-Meteo forecasts.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    weather_data = await weather_service.get_farm_weather(
        lat=farm.latitude,
        lon=farm.longitude,
        village=farm.village,
        district=farm.district
    )

    daily_forecasts = []
    crop_params = irrigation_service.get_crop_params(crop)
    kc = crop_params["stages"].get(growth_stage, list(crop_params["stages"].values())[0])["kc"]

    forecast_list = weather_data.get("forecast", [])
    running_depletion = 15.0

    for idx, f in enumerate(forecast_list):
        day_max = float(f.get("max_temp", 33))
        day_min = float(f.get("min_temp", 24))
        day_rain = float(f.get("precipitation_sum", 0.0))

        eto = irrigation_service.estimate_reference_et0(
            temp_c=day_max,
            temp_min_c=day_min,
            temp_max_c=day_max,
            humidity_percent=60.0
        )
        etc = round(eto * kc, 1)
        eff_rain = irrigation_service.calculate_effective_rainfall(day_rain)

        net_water = max(0.0, round(etc - eff_rain, 1))
        running_depletion += net_water

        irrigate_today = running_depletion >= 25.0 or (crop.lower() == "paddy" and idx % 3 == 0)
        if irrigate_today:
            recommended_depth = round(running_depletion, 1)
            running_depletion = 0.0
        else:
            recommended_depth = 0.0

        daily_forecasts.append({
            "day": f.get("day", "Day"),
            "date": f.get("date", ""),
            "max_temp": day_max,
            "min_temp": day_min,
            "rain_forecast_mm": day_rain,
            "effective_rain_mm": eff_rain,
            "eto_mm": eto,
            "etc_mm": etc,
            "irrigation_needed": irrigate_today,
            "recommended_depth_mm": recommended_depth,
            "action": f"Apply {recommended_depth} mm" if irrigate_today else "No irrigation needed"
        })

    return {
        "farm_id": farm.id,
        "farm_name": farm.farm_name,
        "crop": crop,
        "growth_stage": growth_stage,
        "kc": kc,
        "daily_outlook": daily_forecasts,
        "source": "Open-Meteo 7-Day Live Weather Integration"
    }


@router.post("/record")
def record_irrigation_event(
    req: IrrigationEventCreate,
    x_user_phone: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Stores an actual irrigation event performed by the farmer."""
    user = get_current_user(db, x_user_phone, x_user_id)
    farm = db.query(Farm).filter(Farm.id == req.farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail=f"Farm {req.farm_id} not found")

    event = IrrigationEventRecord(
        user_id=user.id,
        farm_id=req.farm_id,
        crop_name=req.resolved_crop_name,
        event_date=req.resolved_event_date,
        water_applied_mm=req.resolved_water_applied_mm,
        water_volume_m3=req.resolved_water_volume_m3,
        duration_hours=req.duration_hours or 1.0,
        irrigation_method=req.irrigation_method or "Canal / Basin",
        notes=req.notes
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    return {
        "status": "recorded",
        "message": "Irrigation event recorded successfully",
        "id": event.id,
        "crop_name": event.crop_name,
        "event_date": event.event_date,
        "depth_applied_mm": event.water_applied_mm,
        "volume_m3": event.water_volume_m3,
        "created_at": event.created_at.isoformat() if event.created_at else None
    }


@router.get("/history/{farm_id}")
def get_irrigation_history(
    farm_id: int,
    x_user_phone: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Retrieves saved irrigation plans and recorded events for a farm."""
    # Retrieve recorded events
    events = db.query(IrrigationEventRecord).filter(
        IrrigationEventRecord.farm_id == farm_id
    ).order_by(IrrigationEventRecord.id.desc()).limit(15).all()

    # Retrieve calculated plans
    plans = db.query(IrrigationPlanHistory).filter(
        IrrigationPlanHistory.farm_id == farm_id
    ).order_by(IrrigationPlanHistory.id.desc()).limit(5).all()

    event_list = [
            {
                "id": e.id,
                "crop_name": e.crop_name,
                "event_date": e.event_date,
                "water_applied_mm": e.water_applied_mm,
                "water_volume_m3": e.water_volume_m3,
                "duration_hours": e.duration_hours,
                "irrigation_method": e.irrigation_method,
                "notes": e.notes,
                "created_at": e.created_at.isoformat() if e.created_at else None
            }
            for e in events
        ]

    return {
        "farm_id": farm_id,
        "records": event_list,           # alias for tests / frontend compatibility
        "recorded_events": event_list,
        "past_plans": [
            {
                "id": p.id,
                "crop_name": p.crop_name,
                "growth_stage": p.growth_stage,
                "irrigation_method": p.irrigation_method,
                "net_depth_mm": p.net_depth_mm,
                "gross_depth_mm": p.gross_depth_mm,
                "water_volume_m3": p.water_volume_m3,
                "next_irrigation_date": p.next_irrigation_date,
                "created_at": p.created_at.isoformat() if p.created_at else None
            }
            for p in plans
        ]
    }


@router.get("/water-usage/{farm_id}")
def get_water_usage_summary(farm_id: int, db: Session = Depends(get_db)):
    """
    Aggregates recorded water use events against theoretical unmonitored flood baseline
    to measure actual water conservation.
    """
    events = db.query(IrrigationEventRecord).filter(
        IrrigationEventRecord.farm_id == farm_id
    ).all()

    total_applied_m3 = sum(e.water_volume_m3 for e in events)
    total_applied_liters = total_applied_m3 * 1000.0

    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    acreage = farm.acreage if farm else 2.5
    area_ha = acreage * 0.404686

    # Baseline comparison: number of events * standard flood volume (50 mm @ 55% eff ~ 90 mm gross)
    event_count = max(1, len(events))
    baseline_per_event_m3 = (50.0 / 0.55) * area_ha * 10.0
    baseline_total_m3 = round(baseline_per_event_m3 * event_count, 1)

    conserved_m3 = max(0.0, round(baseline_total_m3 - total_applied_m3, 1))
    conserved_percent = round((conserved_m3 / baseline_total_m3) * 100.0, 1) if baseline_total_m3 > 0 else 0.0

    return {
        "farm_id": farm_id,
        "total_events_recorded": len(events),
        "actual_water_used_m3": round(total_applied_m3, 1),
        "actual_water_used_liters": round(total_applied_liters),
        "baseline_flood_water_m3": baseline_total_m3,
        "water_conserved_m3": conserved_m3,
        "conservation_percentage": conserved_percent,
        "assumptions": "Calculated from farmer-recorded irrigation events vs standard unmonitored flood practice."
    }


@router.post("/sensors")
def record_sensor_reading(req: SensorReadingCreate, db: Session = Depends(get_db)):
    """Logs manual or IoT soil moisture sensor measurements."""
    farm = db.query(Farm).filter(Farm.id == req.farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    reading = SensorReadingRecord(
        farm_id=req.farm_id,
        device_id=req.device_id or "MANUAL-01",
        sensor_type=req.sensor_type or "Soil Moisture (VWC)",
        moisture_percent=req.moisture_percent,
        depth_cm=req.depth_cm or 15,
        measurement_source=req.measurement_source or "manual",
        data_quality="verified"
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    return {
        "status": "success",
        "message": "Sensor reading logged",
        "id": reading.id,
        "moisture_percent": reading.moisture_percent,
        "created_at": reading.created_at.isoformat()
    }


@router.get("/sensors/{farm_id}")
def get_sensor_status(farm_id: int, db: Session = Depends(get_db)):
    """Retrieves the latest sensor reading or honest disconnected status."""
    latest = db.query(SensorReadingRecord).filter(
        SensorReadingRecord.farm_id == farm_id
    ).order_by(SensorReadingRecord.id.desc()).first()

    if latest:
        return {
            "farm_id": farm_id,
            "connected": True,
            "device_id": latest.device_id,
            "sensor_type": latest.sensor_type,
            "moisture_percent": latest.moisture_percent,
            "depth_cm": latest.depth_cm,
            "measurement_source": latest.measurement_source,
            "recorded_at": latest.created_at.isoformat() if latest.created_at else None,
            "message": f"Active {latest.measurement_source} reading: {latest.moisture_percent}% Volumetric Water Content."
        }
    else:
        return {
            "farm_id": farm_id,
            "connected": False,
            "message": "Sensor not connected — recommendations are based on weather and soil-water estimates."
        }
