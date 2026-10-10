import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)  # bcrypt hashed password
    verified = Column(Boolean, default=True)
    preferred_language = Column(String, default="en")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    farms = relationship("Farm", back_populates="owner", cascade="all, delete-orphan")
    saved_items = relationship("SavedItem", back_populates="owner", cascade="all, delete-orphan")
    conversations = relationship("AIConversation", back_populates="owner", cascade="all, delete-orphan")


class Farm(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    farm_name = Column(String, nullable=False)
    acreage = Column(Float, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    pincode = Column(String, nullable=False)
    village = Column(String, nullable=False)
    mandal = Column(String, nullable=True)
    district = Column(String, nullable=False)
    state = Column(String, nullable=False, default="Andhra Pradesh")
    survey_number = Column(String, nullable=True)
    
    # Soil & Farming details
    soil_ph = Column(Float, nullable=True)
    soil_ph_updated_at = Column(DateTime, nullable=True)
    soil_type = Column(String, default="Loamy")
    water_availability = Column(String, default="Moderate")
    recent_rainfall = Column(String, default="42 mm (last 30 days)")
    current_season = Column(String, default="Kharif (Jun - Sep)")
    previous_crops = Column(String, default="Paddy, Maize")
    recent_fertilizers = Column(String, default="Urea, DAP")
    irrigation_method = Column(String, default="Drip / Canal")
    current_crops = Column(String, default="Paddy")

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="farms")
    soil_records = relationship("SoilRecord", back_populates="farm", cascade="all, delete-orphan")
    alerts = relationship("WeatherAlert", back_populates="farm", cascade="all, delete-orphan")


class SoilRecord(Base):
    __tablename__ = "farm_soil_records"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    ph = Column(Float, nullable=False)
    measurement_date = Column(DateTime, default=datetime.datetime.utcnow)
    measurement_source = Column(String, default="Soil Testing Lab")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    farm = relationship("Farm", back_populates="soil_records")


class WeatherAlert(Base):
    __tablename__ = "weather_alerts"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    risk_type = Column(String, nullable=False)  # Heavy Rain, Heat Stress, High Wind, etc.
    severity = Column(String, nullable=False)   # high, medium, low
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=False)
    metric = Column(String, nullable=True)
    forecast_window = Column(String, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    farm = relationship("Farm", back_populates="alerts")


class SavedItem(Base):
    __tablename__ = "saved_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=True)
    item_type = Column(String, nullable=False)  # ai_answer, soil_guidance, crop_recommendation, weather_report
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="saved_items")


class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    language = Column(String, default="en")
    audio_available = Column(Boolean, default=True)
    owner = relationship("User", back_populates="conversations")


class Crop(Base):
    __tablename__ = "crops"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    name = Column(String, nullable=False)  # Paddy, Maize, Chilli, Groundnut, Cotton, etc.
    area = Column(Float, nullable=False, default=1.0)
    area_unit = Column(String, default="acres")
    growth_stage = Column(String, default="Vegetative Stage")
    status = Column(String, default="Healthy")  # Healthy, Good, Attention, Critical
    category = Column(String, default="active")  # active, harvested
    soil_ph = Column(Float, nullable=True)
    land_type = Column(String, default="Loamy")
    water_source = Column(String, default="Canal Water")
    planting_date = Column(String, nullable=True)
    expected_harvest_date = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    farm = relationship("Farm", backref="crops")
    owner = relationship("User", backref="crops")


class CropLog(Base):
    __tablename__ = "crop_logs"

    id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=False)
    log_date = Column(String, nullable=False)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)  # planting, fertilizer, irrigation, observation, vision_scan
    description = Column(Text, nullable=False)
    status = Column(String, default="completed")
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    crop = relationship("Crop", backref="logs")


class CropDetailsCache(Base):
    __tablename__ = "crop_details_cache"

    id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(Integer, ForeignKey("crops.id"), unique=True, index=True, nullable=False)
    details_json = Column(Text, nullable=False)
    detected_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    crop = relationship("Crop", backref="cached_details")


class CropRecommendationHistory(Base):
    __tablename__ = "crop_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=True)
    season = Column(String, default="Kharif")
    field_name = Column(String, nullable=True)
    inputs_json = Column(Text, nullable=False)
    recommendations_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", backref="crop_recommendations")
    farm = relationship("Farm", backref="crop_recommendations")


class IrrigationPlanHistory(Base):
    __tablename__ = "irrigation_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    crop_name = Column(String, nullable=False)
    growth_stage = Column(String, default="Vegetative Stage")
    irrigation_method = Column(String, default="Drip System")
    net_depth_mm = Column(Float, nullable=False)
    gross_depth_mm = Column(Float, nullable=False)
    water_volume_m3 = Column(Float, nullable=False)
    next_irrigation_date = Column(String, nullable=True)
    plan_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", backref="irrigation_plans")
    farm = relationship("Farm", backref="irrigation_plans")


class IrrigationEventRecord(Base):
    __tablename__ = "irrigation_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    crop_name = Column(String, nullable=False)
    event_date = Column(String, nullable=False)
    water_applied_mm = Column(Float, nullable=False)
    water_volume_m3 = Column(Float, nullable=False)
    duration_hours = Column(Float, default=1.0)
    irrigation_method = Column(String, default="Canal / Furrow")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", backref="irrigation_events")
    farm = relationship("Farm", backref="irrigation_events")


class SensorReadingRecord(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    device_id = Column(String, default="MANUAL-ENTRY")
    sensor_type = Column(String, default="Soil Moisture (VWC)")
    moisture_percent = Column(Float, nullable=False)
    depth_cm = Column(Integer, default=15)
    measurement_source = Column(String, default="manual")
    data_quality = Column(String, default="verified")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    farm = relationship("Farm", backref="sensor_readings")


