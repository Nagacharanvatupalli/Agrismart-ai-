import { fetchDirectOpenMeteo } from './openMeteo';

const API_BASE = '/api';

export interface User {
  id: number;
  name: string;
  phone: string;
  preferred_language?: string;
  created_at?: string;
}

export function getAuthHeaders(): Record<string, string> {
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('agrismart_user') : null;
  if (userStr) {
    try {
      const u = JSON.parse(userStr);
      return {
        'X-User-Phone': u.phone || '',
        'X-User-Id': String(u.id || '')
      };
    } catch {}
  }
  return {};
}

export interface Farm {
  id: number;
  user_id: number;
  farm_name: string;
  acreage: number;
  latitude: number;
  longitude: number;
  pincode: string;
  village: string;
  mandal?: string;
  district: string;
  state: string;
  survey_number?: string;
  soil_ph?: number | null;
  soil_ph_updated_at?: string;
  soil_type: string;
  water_availability: string;
  recent_rainfall: string;
  current_season: string;
  previous_crops: string;
  recent_fertilizers: string;
  irrigation_method: string;
  current_crops: string;
}

export interface Crop {
  id: number;
  user_id?: number;
  farm_id: number;
  farm_name?: string;
  farm_location?: string;
  name: string;
  area: number;
  area_unit?: string;
  growth_stage: string;
  status: 'Healthy' | 'Good' | 'Attention' | 'Critical' | string;
  category?: 'active' | 'harvested' | string;
  soil_ph?: number | null;
  land_type?: string;
  water_source?: string;
  planting_date?: string;
  expected_harvest_date?: string;
  notes?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WeatherForecastDay {
  day: string;
  date: string;
  full_date?: string;
  max_temp: number;
  min_temp: number;
  rain_chance: number;
  precipitation_sum?: number;
  wind_speed_max?: number;
  condition: string;
  icon: string;
  advisory?: string;
}

export interface WeatherData {
  farm_id?: number;
  farm_name?: string;
  village: string;
  district: string;
  state: string;
  lat: number;
  lon: number;
  updated_at: string;
  current_temp: number;
  feels_like: number;
  condition: string;
  rain_chance: number;
  max_temp: number;
  min_temp: number;
  wind_speed: number;
  humidity: number;
  forecast: WeatherForecastDay[];
  insights: { title: string; message: string; type: string; icon: string }[];
  audio_summary: string;
  hourly?: Array<{ time: string; temp: number; icon: string; rain_chance: number }>;
}

export interface SoilData {
  farm_id: number;
  farm_name: string;
  village: string;
  district: string;
  has_ph: boolean;
  soil_ph?: number | null;
  ph?: number;
  ph_category?: string;
  ph_status?: string;
  health_score?: number;
  target_crop?: string;
  target_crop_suitability?: string;
  ai_summary?: string;
  weather_soil_impact?: string;
  water_source_impact?: string;
  nutrient_absorption?: {
    nitrogen?: string;
    phosphorus?: string;
    potassium?: string;
    micronutrients?: string;
  };
  amendments?: string[];
  stored_in_db?: boolean;
  source?: string;
  last_updated?: string;
  weather_data?: {
    temp: number;
    condition: string;
    rain_chance: number;
    humidity: number;
  };
  farm_factors?: {
    soil_type: string;
    water_availability: string;
    water_source?: string;
    crop_type?: string;
    recent_rainfall: string;
    season: string;
    past_crops: string;
    recent_fertilizers: string;
  };
  guidance?: { title: string; message: string; action: string }[];
  recommended_crops?: { id: string; name: string; suitability: string; reason: string; preferred_ph: string; water_need: string; icon: string; color: string }[];
  side_by_side?: {
    compare_farm_id: number;
    compare_farm_name: string;
    compare_farm_analysis: any;
    comparison: any;
  };
  message?: string;
}

export interface ClimatePrediction {
  id: string;
  category: string;
  title: string;
  severity: 'high' | 'medium' | 'low' | 'safe';
  severity_label?: string;
  metric: string;
  normal_baseline?: string;
  forecast_window: string;
  probability: string;
  agronomic_impact: string;
  action_advice: string;
  mitigation_steps: string[];
  icon: string;
}

export interface DiseaseReport {
  disease_name: string;
  disease_name_en?: string;
  crop_name?: string;
  pathogen_type: string;
  severity: 'Healthy' | 'Mild' | 'Moderate' | 'Severe' | string;
  confidence: number;
  vitality_score?: string;
  canopy_coverage?: string;
  symptoms: string[];
  chemical_cure: string[];
  organic_cure: string[];
  prevention: string[];
}

export interface AIAskResponse {
  question: string;
  answer: string;
  language: string;
  recommendations: string[];
  evidence?: string;
  disease_report?: DiseaseReport;
  image_url?: string;
  detected_disease?: string;
  severity?: string;
  confidence?: number;
}

export interface ClimateRiskData {
  farm_location: string;
  state: string;
  crop_name: string;
  coordinates: { latitude: number; longitude: number };
  updated_at: string;
  overall_risk_level: string;
  overall_risk_level_en?: 'High' | 'Moderate' | 'Low';
  crop_name_en?: string;
  overall_risk_score: number;
  summary_headline: string;
  primary_threat: string;
  weather_snapshot: {
    temp: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    wind_gusts?: number;
    rain_chance: number;
    condition: string;
  };
  predictions: ClimatePrediction[];
  seven_day_timeline: Array<{
    day: string;
    date: string;
    full_date: string;
    condition: string;
    max_temp: number;
    min_temp: number;
    rain_chance: number;
    precipitation_sum: number;
    wind_gusts: number;
    risk_level: string;
    primary_hazard: string;
  }>;
  hourly_today: Array<{
    time_label: string;
    hour: number;
    temp: number;
    humidity: number;
    rain_chance: number;
    wind_speed: number;
    risk_level: string;
  }>;
  extended_outlook: {
    period: string;
    regional_zone: string;
    historical_anomaly: string;
    monsoon_outlook: string;
    dry_spell_duration: string;
    cumulative_rain_estimate: string;
    key_recommendation: string;
  };
  field_operations?: {
    spraying_window?: {
      status: string;
      best_time: string;
      reason: string;
    };
    drainage_urgency?: string;
    irrigation_strategy?: string;
  };
}

// ==============================================================================
// Crop Recommendation Interfaces
// ==============================================================================
export interface CropRecommendationItem {
  id: string;
  name: string;
  scientific_name?: string;
  telugu_name?: string;
  category?: string;
  suitability: 'High suitability' | 'Suitable' | 'Alternative option' | string;
  suitabilityType: 'best' | 'good' | 'alternative';
  score: number;
  score_breakdown?: {
    soil_compatibility?: number;
    temperature_compatibility?: number;
    rainfall_compatibility?: number;
    water_availability?: number;
    seasonal_suitability?: number;
    nutrient_compatibility?: number;
  };
  seasonType: string;
  season: string;
  phRange: string;
  yieldEstimate: string;
  waterReq: string;
  bullets: string[];
  whyRecommended: string[];
  risks?: string[];
  missing_inputs?: string[];
  interCrops: Array<{ id: string; name: string; timing: string }>;
  image_url?: string;
  data_source?: string;
  timestamp?: string;
}

export interface CropRecommendationResponse {
  farm_id?: number;
  field_name: string;
  location: string;
  season: string;
  soil_ph?: number;
  soil_type: string;
  water_source: string;
  weather_snapshot?: {
    temperature: number;
    condition: string;
    humidity: number;
    rain_chance: number;
    data_source: string;
  };
  total_crops_evaluated: number;
  recommendations: CropRecommendationItem[];
  generated_at: string;
}

export interface CropComparisonResult {
  comparison: Array<{
    id: string;
    name: string;
    score: number;
    suitability: string;
    season: string;
    growing_duration: string;
    duration_days_num: number;
    seasonal_water_demand_mm: number;
    irrigation_per_event: string;
    soil_suitability: string;
    climate_suitability: string;
    expected_yield: string;
    drought_tolerance: string;
    waterlogging_sensitivity: string;
    risks: string[];
    intercrops: string[];
  }>;
  insights: {
    highest_ranked?: string;
    lowest_water_consumer?: string;
    fastest_harvest?: string;
    soil_context: string;
  };
}

// ==============================================================================
// Smart Irrigation Interfaces
// ==============================================================================
export interface IrrigationPlanResponse {
  crop: string;
  growth_stage: string;
  kc: number;
  acreage: number;
  area_hectares: number;
  soil_type: string;
  water_source: string;
  irrigation_method: string;
  application_efficiency: number;
  fao_calculation: {
    daily_eto_mm: number;
    daily_etc_mm: number;
    root_depth_m: number;
    taw_mm: number;
    raw_mm: number;
    soil_depletion_mm: number;
    effective_rain_mm: number;
    net_depth_mm: number;
    gross_depth_mm: number;
    calculation_method: string;
  };
  net_depth_mm: number;
  gross_depth_mm: number;
  depth_min: number;
  depth_max: number;
  water_volume_m3: number;
  water_volume_liters: number;
  water_volume_lakh_liters: number;
  volume_label: string;
  pump_duration_hours: number;
  pump_duration_label: string;
  pump_flow_rate_assumed: string;
  next_date: string;
  urgency: 'high' | 'normal' | 'postpone' | string;
  optimal_window: string;
  window_rationale: string;
  why_recommendation: string;
  weather_snapshot: {
    temp: number;
    humidity: number;
    wind_speed: number;
    forecast_rain_7d: number;
    effective_rain_expected: number;
  };
  water_saving: {
    baseline_volume_m3: number;
    baseline_liters: number;
    adjusted_volume_m3: number;
    adjusted_liters: number;
    saved_volume_m3: number;
    saved_liters: number;
    saving_percentage: number;
    assumptions: string;
  };
  method_comparison: Array<{
    method: string;
    efficiency_percent: number;
    gross_depth_mm: number;
    gross_volume_m3: number;
    water_loss_percent: number;
    suitability: string;
    energy_cost_index: string;
  }>;
  sensor_info: {
    sensor_connected: boolean;
    message: string;
    reading_value?: number | null;
  };
  additional_advice: string[];
  farm_id?: number;
  farm_name?: string;
  village?: string;
  district?: string;
  saved_plan_id?: number;
  timestamp: string;
}

export interface IrrigationHistoryResponse {
  farm_id: number;
  recorded_events: Array<{
    id: number;
    crop_name: string;
    event_date: string;
    water_applied_mm: number;
    water_volume_m3: number;
    duration_hours: number;
    irrigation_method: string;
    notes?: string;
    created_at?: string;
  }>;
  past_plans: Array<{
    id: number;
    crop_name: string;
    growth_stage: string;
    irrigation_method: string;
    net_depth_mm: number;
    gross_depth_mm: number;
    water_volume_m3: number;
    next_irrigation_date: string;
    created_at?: string;
  }>;
}

export function getActiveLang(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('agrismart_lang') || 'en';
  }
  return 'en';
}

export const api = {
  // Auth & Profile
  async login(name: string, phone: string, preferred_language: string = 'en', password?: string): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, otp: '123456', preferred_language, password })
    });
    if (!res.ok) throw new Error("Failed to sign in");
    const user: User = await res.json();
    if (typeof window !== 'undefined') {
      localStorage.setItem('agrismart_user', JSON.stringify(user));
    }
    return user;
  },

  async loginWithPassword(phone: string, password: string): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/login-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Login failed. Check your phone number and password.");
    }
    const user: User = await res.json();
    if (typeof window !== 'undefined') {
      localStorage.setItem('agrismart_user', JSON.stringify(user));
    }
    return user;
  },

  async getProfile(): Promise<User> {
    const res = await fetch(`${API_BASE}/profile`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to load profile");
    const user: User = await res.json();
    if (typeof window !== 'undefined') {
      localStorage.setItem('agrismart_user', JSON.stringify(user));
    }
    return user;
  },

  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('agrismart_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {}
    }
    return null;
  },

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('agrismart_user');
    }
  },

  // Farms
  async getFarms(): Promise<Farm[]> {
    const res = await fetch(`${API_BASE}/farms`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch farms");
    return res.json();
  },

  async createFarm(data: Partial<Farm>): Promise<Farm> {
    const res = await fetch(`${API_BASE}/farms`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to create farm");
    return res.json();
  },

  async updateFarm(id: number, data: Partial<Farm>): Promise<Farm> {
    const res = await fetch(`${API_BASE}/farms/${id}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to update farm");
    return res.json();
  },

  async deleteFarm(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/farms/${id}`, { 
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to delete farm");
  },

  // Weather
  async getWeather(
    farmId?: number,
    farmMeta?: { lat?: number; lon?: number; village?: string; district?: string; state?: string },
    lang?: string
  ): Promise<WeatherData> {
    const lat = farmMeta?.lat ?? 16.54;
    const lon = farmMeta?.lon ?? 81.51;
    const village = farmMeta?.village ?? "Bhimavaram";
    const district = farmMeta?.district ?? "West Godavari";
    const state = farmMeta?.state ?? "Andhra Pradesh";
    const language = lang || getActiveLang();

    if (farmId) {
      try {
        const res = await fetch(`${API_BASE}/farms/${farmId}/weather?lang=${language}`);
        if (res.ok) {
          const data = await res.json();
          if (data.forecast) {
            console.group("🌦️ [Backend -> Open-Meteo] Live 7-Day Weather Forecast:");
            console.table(data.forecast);
            console.groupEnd();
          }
          return data;
        }
      } catch (err) {
        console.warn(`[Weather] Backend API call failed for farm ${farmId}, connecting directly to Open-Meteo:`, err);
      }
    }

    return await fetchDirectOpenMeteo(lat, lon, village, district, state);
  },

  async getDirectWeather(
    lat: number = 16.54,
    lon: number = 81.51,
    village: string = "Bhimavaram",
    district: string = "West Godavari",
    state: string = "Andhra Pradesh",
    lang?: string
  ): Promise<WeatherData> {
    const language = lang || getActiveLang();
    try {
      const res = await fetch(`${API_BASE}/weather?lat=${lat}&lon=${lon}&village=${encodeURIComponent(village)}&district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}&lang=${language}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }
    return await fetchDirectOpenMeteo(lat, lon, village, district, state);
  },

  // Soil
  async getSoil(farmId: number, cropType?: string, refresh?: boolean, lang?: string): Promise<SoilData> {
    const language = lang || getActiveLang();
    const params = new URLSearchParams();
    if (cropType) params.append('crop_type', cropType);
    if (refresh) params.append('refresh', 'true');
    params.append('lang', language);
    const url = `${API_BASE}/farms/${farmId}/soil?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch soil data");
    return res.json();
  },

  async compareSoilLocations(locationA: any, locationB: any, userId: number = 1): Promise<any> {
    const res = await fetch(`${API_BASE}/farms/soil/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        location_a: locationA,
        location_b: locationB
      })
    });
    if (!res.ok) throw new Error("Failed to compare soil locations");
    return res.json();
  },

  async updateSoilPh(farmId: number, ph: number): Promise<SoilData> {
    const res = await fetch(`${API_BASE}/farms/${farmId}/soil`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ soil_ph: ph })
    });
    if (!res.ok) throw new Error("Failed to update soil pH");
    return res.json();
  },

  // AI Ask & Crop Disease Detection
  async askAI(
    question: string,
    farmId?: number,
    language: string = 'en',
    imageBase64?: string | null,
    cropName?: string,
    isDiseaseScan?: boolean
  ): Promise<AIAskResponse> {
    const res = await fetch(`${API_BASE}/ai/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        farm_id: farmId,
        language,
        image_base64: imageBase64,
        crop_name: cropName,
        is_disease_scan: isDiseaseScan
      })
    });
    if (!res.ok) throw new Error("Failed to query AI");
    return res.json();
  },

  async detectCropDisease(
    imageBase64: string,
    farmId?: number,
    language: string = 'en',
    cropName?: string,
    customQuery?: string
  ): Promise<AIAskResponse> {
    return this.askAI(
      customQuery || "Analyze this crop image for pests, diseases, and remedies",
      farmId,
      language,
      imageBase64,
      cropName,
      true
    );
  },

  // Location
  async lookupPincode(pincode: string) {
    const res = await fetch(`${API_BASE}/location/pincode/${pincode}`);
    if (!res.ok) throw new Error("Invalid PIN code");
    return res.json();
  },

  async reverseGeocode(lat: number, lon: number) {
    const res = await fetch(`${API_BASE}/location/reverse-geocode?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error("Reverse geocode failed");
    return res.json();
  },

  // Alerts & Climate Predictions
  async getAlerts() {
    const res = await fetch(`${API_BASE}/alerts`);
    return res.json();
  },

  async getClimatePredictions(farmId?: number, period: string = 'today', lang?: string): Promise<ClimateRiskData> {
    const language = lang || getActiveLang();
    const params = new URLSearchParams();
    if (farmId) params.append('farm_id', String(farmId));
    if (period) params.append('period', period);
    params.append('lang', language);
    const res = await fetch(`${API_BASE}/alerts/climate-predictions?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to load climate predictions");
    return res.json();
  },

  async getSaved() {
    const res = await fetch(`${API_BASE}/saved`);
    return res.json();
  },

  async saveItem(data: any) {
    const res = await fetch(`${API_BASE}/saved`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteSaved(id: number) {
    await fetch(`${API_BASE}/saved/${id}`, { method: 'DELETE' });
  },

  // Insights
  async getFarmInsights(farmId: number) {
    const res = await fetch(`${API_BASE}/farms/${farmId}/insights`);
    if (!res.ok) throw new Error("Failed to fetch dynamic farm insights");
    return res.json();
  },

  // Crop Recommendation Intelligence
  async getCropRecommendations(params: {
    farm_id?: number;
    field_name?: string;
    village?: string;
    district?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
    area?: number;
    area_unit?: string;
    season?: string;
    sowing_date?: string;
    water_source?: string;
    soil_type?: string;
    soil_ph?: number | null;
    nitrogen_kg_ha?: number;
    phosphorus_kg_ha?: number;
    potassium_kg_ha?: number;
    organic_carbon_percent?: number;
    previous_crop?: string;
    preferred_category?: string;
  }, lang?: string): Promise<CropRecommendationResponse> {
    const language = lang || getActiveLang();
    const res = await fetch(`${API_BASE}/crops/recommend?lang=${language}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error("Failed to generate crop recommendations");
    return res.json();
  },

  async getCropCatalog(): Promise<CropRecommendationItem[]> {
    const res = await fetch(`${API_BASE}/crops/catalog`);
    if (!res.ok) throw new Error("Failed to load crop catalog");
    return res.json();
  },

  async getCropCatalogDetail(cropId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/crops/catalog/${cropId}`);
    if (!res.ok) throw new Error("Failed to load crop details");
    return res.json();
  },

  async compareCrops(params: {
    crop_ids: string[];
    farm_id?: number;
    soil_ph?: number;
    soil_type?: string;
    season?: string;
    water_source?: string;
  }): Promise<CropComparisonResult> {
    const res = await fetch(`${API_BASE}/crops/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error("Failed to compare crops");
    return res.json();
  },

  async saveCropRecommendation(payload: {
    farm_id?: number;
    field_name: string;
    season: string;
    inputs: Record<string, any>;
    recommendations: any[];
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/crops/recommend/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Failed to save crop recommendation");
    return res.json();
  },

  async getCropRecommendationHistory(farmId: number): Promise<any[]> {
    const res = await fetch(`${API_BASE}/crops/recommend/history/${farmId}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch recommendation history");
    return res.json();
  },

  // Smart Irrigation Intelligence
  async getIrrigationPlan(
    farmId: number,
    crop: string,
    waterSource: string,
    growthStage: string = "Vegetative Stage",
    options?: {
      area?: number;
      area_unit?: string;
      soil_type?: string;
      irrigation_method?: string;
      application_efficiency?: number;
      pump_flow_rate_m3_hr?: number;
      measured_soil_moisture_percent?: number;
    },
    lang?: string
  ): Promise<IrrigationPlanResponse> {
    const language = lang || getActiveLang();
    const payload = {
      farm_id: farmId,
      crop,
      water_source: waterSource,
      growth_stage: growthStage,
      ...options
    };
    const res = await fetch(`${API_BASE}/irrigation/plan?lang=${language}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Failed to fetch irrigation plan");
    return res.json();
  },

  async getIrrigationForecast(farmId: number, crop: string = "Paddy", growthStage: string = "Vegetative Stage"): Promise<any> {
    const res = await fetch(`${API_BASE}/irrigation/forecast/${farmId}?crop=${encodeURIComponent(crop)}&growth_stage=${encodeURIComponent(growthStage)}`);
    if (!res.ok) throw new Error("Failed to load irrigation forecast");
    return res.json();
  },

  async recordIrrigationEvent(event: {
    farm_id: number;
    crop_name: string;
    event_date: string;
    water_applied_mm: number;
    water_volume_m3: number;
    duration_hours?: number;
    irrigation_method?: string;
    notes?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/irrigation/record`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(event)
    });
    if (!res.ok) throw new Error("Failed to record irrigation event");
    return res.json();
  },

  async getIrrigationHistory(farmId: number): Promise<IrrigationHistoryResponse> {
    const res = await fetch(`${API_BASE}/irrigation/history/${farmId}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to load irrigation history");
    return res.json();
  },

  async getWaterUsageSummary(farmId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/irrigation/water-usage/${farmId}`);
    if (!res.ok) throw new Error("Failed to fetch water usage summary");
    return res.json();
  },

  async logSensorReading(farmId: number, moisturePercent: number, deviceId: string = "MANUAL-01"): Promise<any> {
    const res = await fetch(`${API_BASE}/irrigation/sensors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ farm_id: farmId, moisture_percent: moisturePercent, device_id: deviceId })
    });
    if (!res.ok) throw new Error("Failed to log sensor reading");
    return res.json();
  },

  async getSensorStatus(farmId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/irrigation/sensors/${farmId}`);
    if (!res.ok) throw new Error("Failed to load sensor status");
    return res.json();
  },

  // My Crops
  async getCrops(userId?: number): Promise<Crop[]> {
    const user = this.getCurrentUser();
    const uid = userId || user?.id;
    const url = uid ? `${API_BASE}/crops?user_id=${uid}` : `${API_BASE}/crops`;
    const res = await fetch(url, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch crops");
    return res.json();
  },

  async createCrop(data: Partial<Crop>): Promise<Crop> {
    const res = await fetch(`${API_BASE}/crops`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to create crop");
    return res.json();
  },

  async getCrop(id: number): Promise<Crop> {
    const res = await fetch(`${API_BASE}/crops/${id}`);
    if (!res.ok) throw new Error("Failed to fetch crop");
    return res.json();
  },

  async updateCrop(id: number, data: Partial<Crop>): Promise<Crop> {
    const res = await fetch(`${API_BASE}/crops/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to update crop");
    return res.json();
  },

  async deleteCrop(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/crops/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error("Failed to delete crop");
  },

  async getCropFullDetails(id: number, forceRefresh = false): Promise<any> {
    const url = forceRefresh
      ? `${API_BASE}/crops/${id}/details?force_refresh=true`
      : `${API_BASE}/crops/${id}/details`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch crop details");
    return res.json();
  },

  async updateCropStatusWithImage(
    id: number,
    data: { stage?: string; status?: string; notes?: string; image_url?: string }
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/crops/${id}/update-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to update crop status with image");
    return res.json();
  },

  async scanCropImage(id: number, imageBase64: string): Promise<any> {
    const res = await fetch(`${API_BASE}/crops/${id}/scan-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_base64: imageBase64 })
    });
    if (!res.ok) throw new Error("Failed to analyze crop image");
    return res.json();
  },

  async addCropLog(
    id: number,
    log: { title: string; category?: string; description: string; date?: string }
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/crops/${id}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log)
    });
    if (!res.ok) throw new Error("Failed to add crop activity log");
    return res.json();
  },

  async getCropLogs(id: number): Promise<any[]> {
    const res = await fetch(`${API_BASE}/crops/${id}/logs`);
    if (!res.ok) throw new Error("Failed to fetch crop logs");
    return res.json();
  },

  async getCropGrowth(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/crops/${id}/growth`);
    if (!res.ok) throw new Error("Failed to fetch crop growth data");
    return res.json();
  },

  async chatCropAssistant(id: number, question: string, language: string = "en"): Promise<any> {
    const res = await fetch(`${API_BASE}/crops/${id}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, language })
    });
    if (!res.ok) throw new Error("Failed to chat with crop assistant");
    return res.json();
  }
};

