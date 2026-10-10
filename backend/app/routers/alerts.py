from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import WeatherAlert, Farm
from ..schemas import WeatherAlertResponse
from ..services.weather_service import weather_service

router = APIRouter(prefix="/api/alerts", tags=["Climate Alerts"])

@router.get("/climate-predictions")
async def get_climate_risk_predictions(
    farm_id: Optional[int] = Query(None),
    period: Optional[str] = Query("today"),
    lang: str = Query("en"),
    db: Session = Depends(get_db)
):
    """Fetches real-time climate risk predictions for a farm using live Open-Meteo weather API data with regional localization."""
    lat = 16.5449
    lon = 81.5212
    village = "Bhimavaram"
    district = "West Godavari"
    state = "Andhra Pradesh"
    crop_name = "Paddy"

    if farm_id:
        farm = db.query(Farm).filter(Farm.id == farm_id).first()
        if farm:
            lat = farm.latitude or lat
            lon = farm.longitude or lon
            village = farm.village or village
            district = farm.district or district
            state = farm.state or state
            crop_name = farm.current_crops or crop_name
    else:
        farm = db.query(Farm).first()
        if farm:
            lat = farm.latitude or lat
            lon = farm.longitude or lon
            village = farm.village or village
            district = farm.district or district
            state = farm.state or state
            crop_name = farm.current_crops or crop_name

    risks = await weather_service.get_climate_risks(
        lat=lat,
        lon=lon,
        village=village,
        district=district,
        state=state,
        crop_name=crop_name,
        language=lang
    )
    return risks


@router.get("", response_model=List[WeatherAlertResponse])
def get_all_alerts(db: Session = Depends(get_db)):
    alerts = db.query(WeatherAlert).order_by(WeatherAlert.created_at.desc()).all()
    if not alerts:
        # Seed default alerts if empty
        farms = db.query(Farm).all()
        farm_id = farms[0].id if farms else 1
        a1 = WeatherAlert(
            farm_id=farm_id,
            risk_type="Heavy Rainfall",
            severity="high",
            title="Heavy Rainfall Warning (13 Aug)",
            message="Forecast predicts 45mm rainfall in West Godavari district over the next 24 hours.",
            recommendation="Clear field drainage channels and postpone fertilizer application.",
            metric="45 mm rain",
            forecast_window="24 hours",
            is_read=False
        )
        a2 = WeatherAlert(
            farm_id=farm_id,
            risk_type="Heat Stress",
            severity="medium",
            title="High Evaporative Demand Alert",
            message="Temperatures reaching 34°C with dry winds expected.",
            recommendation="Provide light irrigation during early morning or evening hours.",
            metric="34°C Max Temp",
            forecast_window="48 hours",
            is_read=True
        )
        db.add_all([a1, a2])
        db.commit()
        alerts = [a1, a2]

    return alerts

@router.patch("/{alert_id}/read")
def mark_alert_read(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(WeatherAlert).filter(WeatherAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    db.commit()
    return {"message": "Alert marked as read", "id": alert_id}

@router.patch("/read-all")
def mark_all_read(db: Session = Depends(get_db)):
    db.query(WeatherAlert).update({WeatherAlert.is_read: True})
    db.commit()
    return {"message": "All alerts marked as read"}
