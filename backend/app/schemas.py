from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

# Auth Schemas
class OTPRequest(BaseModel):
    phone: str
    name: Optional[str] = "Farmer"

class OTPVerifyRequest(BaseModel):
    phone: str
    otp: str = "123456"
    name: Optional[str] = "Farmer"
    password: Optional[str] = None   # NEW: set password on first signup
    preferred_language: Optional[str] = "en"

class LoginRequest(BaseModel):
    """Used when an existing user logs in with phone + password."""
    phone: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    phone: str
    preferred_language: str
    created_at: datetime
    class Config:
        from_attributes = True

# Farm Schemas
class FarmCreate(BaseModel):
    farm_name: str
    acreage: float = Field(gt=0, description="Acreage must be greater than 0")
    latitude: float = 16.5449
    longitude: float = 81.5212
    pincode: str = "534201"
    village: str
    mandal: Optional[str] = ""
    district: str
    state: str = "Andhra Pradesh"
    survey_number: Optional[str] = None
    soil_ph: Optional[float] = None
    soil_type: Optional[str] = "Loamy"
    water_availability: Optional[str] = "Moderate"
    current_crops: Optional[str] = "Paddy"

class FarmUpdate(BaseModel):
    farm_name: Optional[str] = None
    acreage: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    pincode: Optional[str] = None
    village: Optional[str] = None
    mandal: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    survey_number: Optional[str] = None
    soil_ph: Optional[float] = None
    soil_type: Optional[str] = None
    water_availability: Optional[str] = None
    recent_rainfall: Optional[str] = None
    current_season: Optional[str] = None
    previous_crops: Optional[str] = None
    recent_fertilizers: Optional[str] = None
    irrigation_method: Optional[str] = None
    current_crops: Optional[str] = None

class FarmResponse(BaseModel):
    id: int
    user_id: int
    farm_name: str
    acreage: float
    latitude: float
    longitude: float
    pincode: str
    village: str
    mandal: Optional[str]
    district: str
    state: str
    survey_number: Optional[str]
    soil_ph: Optional[float]
    soil_ph_updated_at: Optional[datetime]
    soil_type: str
    water_availability: str
    recent_rainfall: str
    current_season: str
    previous_crops: str
    recent_fertilizers: str
    irrigation_method: str
    current_crops: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# Location Schemas
class PincodeResponse(BaseModel):
    pincode: str
    post_office: str
    village: str
    mandal: str
    district: str
    state: str
    latitude: float
    longitude: float

class ReverseGeocodeResponse(BaseModel):
    latitude: float
    longitude: float
    village: str
    mandal: str
    district: str
    state: str
    pincode: str

# Soil Schemas
class SoilPHUpdate(BaseModel):
    soil_ph: float = Field(ge=0.0, le=14.0, description="pH value between 0 and 14")
    measurement_source: Optional[str] = "Soil Testing Lab"

# AI Schemas
class AIAskRequest(BaseModel):
    question: Optional[str] = ""
    farm_id: Optional[int] = None
    language: Optional[str] = "en"
    image_base64: Optional[str] = None
    mime_type: Optional[str] = "image/jpeg"
    crop_name: Optional[str] = None
    is_disease_scan: Optional[bool] = False

class AIAskResponse(BaseModel):
    question: str
    answer: str
    language: str
    recommendations: List[str] = []
    evidence: Optional[str] = None
    disease_report: Optional[Dict[str, Any]] = None
    image_url: Optional[str] = None
    detected_disease: Optional[str] = None
    severity: Optional[str] = None
    confidence: Optional[float] = None

# Weather Alerts & Saved Items
class WeatherAlertResponse(BaseModel):
    id: int
    farm_id: int
    risk_type: str
    severity: str
    title: str
    message: str
    recommendation: str
    metric: Optional[str]
    forecast_window: Optional[str]
    is_read: bool
    created_at: datetime
    class Config:
        from_attributes = True

class SavedItemCreate(BaseModel):
    farm_id: Optional[int] = None
    item_type: str
    title: str
    content: str
    metadata_json: Optional[Any] = None

class SavedItemResponse(BaseModel):
    id: int
    user_id: int
    farm_id: Optional[int]
    item_type: str
    title: str
    content: str
    metadata_json: Optional[Any]
    created_at: datetime
    class Config:
        from_attributes = True

# Crop Schemas
class CropCreate(BaseModel):
    name: str
    farm_id: int
    area: float = Field(gt=0, description="Area must be positive")
    area_unit: Optional[str] = "acres"
    growth_stage: Optional[str] = "Vegetative Stage"
    status: Optional[str] = "Healthy"
    category: Optional[str] = "active"
    soil_ph: Optional[float] = None
    land_type: Optional[str] = "Loamy"
    water_source: Optional[str] = "Canal Water"
    planting_date: Optional[str] = None
    expected_harvest_date: Optional[str] = None
    notes: Optional[str] = None

class CropUpdate(BaseModel):
    name: Optional[str] = None
    farm_id: Optional[int] = None
    area: Optional[float] = None
    area_unit: Optional[str] = None
    growth_stage: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None
    soil_ph: Optional[float] = None
    land_type: Optional[str] = None
    water_source: Optional[str] = None
    planting_date: Optional[str] = None
    expected_harvest_date: Optional[str] = None
    notes: Optional[str] = None

class CropResponse(BaseModel):
    id: int
    user_id: int
    farm_id: int
    farm_name: Optional[str] = None
    farm_location: Optional[str] = None
    name: str
    area: float
    area_unit: str = "acres"
    growth_stage: str
    status: str
    category: str = "active"
    soil_ph: Optional[float] = None
    land_type: Optional[str] = None
    water_source: Optional[str] = None
    planting_date: Optional[str] = None
    expected_harvest_date: Optional[str] = None
    notes: Optional[str] = None
    image_url: Optional[str] = None
    class Config:
        from_attributes = True


# ==============================================================================
# Crop Recommendation Schemas
# ==============================================================================
class CropRecommendationRequest(BaseModel):
    farm_id: Optional[int] = None
    field_name: Optional[str] = "Main Field"
    village: Optional[str] = "Bhimavaram"
    district: Optional[str] = "West Godavari"
    state: Optional[str] = "Andhra Pradesh"
    latitude: Optional[float] = 16.5449
    longitude: Optional[float] = 81.5212
    area: Optional[float] = 2.5
    area_unit: Optional[str] = "acres"
    season: Optional[str] = "Kharif"  # Kharif, Rabi, Pre-summer, All
    sowing_date: Optional[str] = None
    water_source: Optional[str] = "Canal"  # Canal, Borewell, Tank/Pond, Drip System, Rainfed
    soil_type: Optional[str] = "Loamy"  # Loamy, Clay Loam, Sandy Loam, Black Cotton, Clay, Alluvial
    soil_ph: Optional[float] = None
    nitrogen_kg_ha: Optional[float] = None
    phosphorus_kg_ha: Optional[float] = None
    potassium_kg_ha: Optional[float] = None
    organic_carbon_percent: Optional[float] = None
    previous_crop: Optional[str] = None
    preferred_category: Optional[str] = None  # Cereals, Pulses, Commercial, Oilseeds, Vegetables, Spices


class CropRecommendationSaveRequest(BaseModel):
    farm_id: Optional[int] = None
    field_name: str
    season: str
    inputs: Dict[str, Any]
    recommendations: List[Dict[str, Any]]


class CropCompareRequest(BaseModel):
    crop_ids: List[str]
    farm_id: Optional[int] = None
    soil_ph: Optional[float] = 6.8
    soil_type: Optional[str] = "Loamy"
    season: Optional[str] = "Kharif"
    water_source: Optional[str] = "Canal"


# ==============================================================================
# Smart Irrigation Schemas
# ==============================================================================
class IrrigationPlanCalculateRequest(BaseModel):
    farm_id: Optional[int] = None
    crop: str = "Paddy"
    growth_stage: str = "Vegetative Stage"
    sowing_date: Optional[str] = None
    area: Optional[float] = 2.5
    area_unit: Optional[str] = "acres"
    soil_type: Optional[str] = "Loamy"
    irrigation_method: Optional[str] = "Drip System"  # Drip System, Sprinkler, Canal / Basin / Furrow
    application_efficiency: Optional[float] = None  # 0.50 - 0.95
    water_source: Optional[str] = "Canal"
    pump_flow_rate_m3_hr: Optional[float] = 30.0  # e.g. 5 HP pump ~ 30 m3/hr
    measured_soil_moisture_percent: Optional[float] = None
    depletion_threshold_percent: Optional[float] = 50.0


class IrrigationEventCreate(BaseModel):
    farm_id: int
    # Accept both naming conventions (frontend vs. test)
    crop_name: Optional[str] = None
    crop: Optional[str] = None  # alias for crop_name
    event_date: Optional[str] = None
    irrigation_date: Optional[str] = None  # alias for event_date
    water_applied_mm: Optional[float] = None
    depth_applied_mm: Optional[float] = None  # alias for water_applied_mm
    water_volume_m3: Optional[float] = None
    volume_m3: Optional[float] = None  # alias for water_volume_m3
    duration_hours: Optional[float] = 1.0
    irrigation_method: Optional[str] = "Canal / Basin"
    notes: Optional[str] = None

    @property
    def resolved_crop_name(self) -> str:
        return self.crop_name or self.crop or "Unknown Crop"

    @property
    def resolved_event_date(self) -> str:
        return self.event_date or self.irrigation_date or str(__import__('datetime').date.today())

    @property
    def resolved_water_applied_mm(self) -> float:
        return self.water_applied_mm or self.depth_applied_mm or 0.0

    @property
    def resolved_water_volume_m3(self) -> float:
        return self.water_volume_m3 or self.volume_m3 or 0.0


class SensorReadingCreate(BaseModel):
    farm_id: int
    device_id: Optional[str] = "MANUAL-01"
    sensor_type: Optional[str] = "Soil Moisture (VWC)"
    moisture_percent: float
    depth_cm: Optional[int] = 15
    measurement_source: Optional[str] = "manual"
