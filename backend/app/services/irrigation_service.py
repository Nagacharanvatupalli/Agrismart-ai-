import math
import datetime
from typing import Dict, Any, List, Optional
from .localization import localization_service

# ==============================================================================
# FAO-56 Crop Coefficients & Growth Stages
# Reference: FAO Irrigation and Drainage Paper No. 56 (Allen et al., 1998)
# ==============================================================================

FAO_CROP_PARAMETERS: Dict[str, Dict[str, Any]] = {
    "Paddy": {
        "name": "Paddy (Rice)",
        "stages": {
            "Initial / Nursery": {"kc": 1.05, "root_depth_m": 0.20, "p": 0.20},
            "Vegetative / Tillering": {"kc": 1.15, "root_depth_m": 0.35, "p": 0.20},
            "Panicle Initiation / Reproductive": {"kc": 1.25, "root_depth_m": 0.50, "p": 0.20},
            "Ripening / Maturation": {"kc": 0.90, "root_depth_m": 0.50, "p": 0.35}
        },
        "default_stage": "Vegetative / Tillering",
        "standing_water_depth_mm": 25.0,  # Paddy unique: requires shallow standing water in vegetative stage
        "preferred_method": "Canal / Basin",
        "efficiency_default": 0.60
    },
    "Maize": {
        "name": "Maize (Corn)",
        "stages": {
            "Initial / Emergence": {"kc": 0.40, "root_depth_m": 0.30, "p": 0.55},
            "Vegetative Stage": {"kc": 0.80, "root_depth_m": 0.60, "p": 0.55},
            "Flowering / Tasseling": {"kc": 1.20, "root_depth_m": 0.90, "p": 0.50},
            "Grain Filling / Maturity": {"kc": 0.60, "root_depth_m": 1.00, "p": 0.60}
        },
        "default_stage": "Vegetative Stage",
        "preferred_method": "Drip System",
        "efficiency_default": 0.88
    },
    "Chilli": {
        "name": "Chilli",
        "stages": {
            "Initial / Transplanting": {"kc": 0.60, "root_depth_m": 0.25, "p": 0.30},
            "Vegetative Stage": {"kc": 0.85, "root_depth_m": 0.45, "p": 0.30},
            "Flowering & Fruit Set": {"kc": 1.05, "root_depth_m": 0.60, "p": 0.30},
            "Ripening / Harvesting": {"kc": 0.80, "root_depth_m": 0.60, "p": 0.40}
        },
        "default_stage": "Vegetative Stage",
        "preferred_method": "Drip System",
        "efficiency_default": 0.90
    },
    "Cotton": {
        "name": "Cotton",
        "stages": {
            "Initial / Seedling": {"kc": 0.45, "root_depth_m": 0.30, "p": 0.65},
            "Vegetative / Squaring": {"kc": 0.75, "root_depth_m": 0.70, "p": 0.65},
            "Boll Formation / Flowering": {"kc": 1.20, "root_depth_m": 1.10, "p": 0.60},
            "Boll Opening / Maturation": {"kc": 0.65, "root_depth_m": 1.20, "p": 0.70}
        },
        "default_stage": "Vegetative / Squaring",
        "preferred_method": "Drip System",
        "efficiency_default": 0.85
    },
    "Groundnut": {
        "name": "Groundnut",
        "stages": {
            "Initial / Seedling": {"kc": 0.40, "root_depth_m": 0.25, "p": 0.50},
            "Vegetative / Pegging": {"kc": 0.80, "root_depth_m": 0.45, "p": 0.50},
            "Pod Development": {"kc": 1.15, "root_depth_m": 0.60, "p": 0.45},
            "Pod Maturation": {"kc": 0.60, "root_depth_m": 0.60, "p": 0.60}
        },
        "default_stage": "Vegetative / Pegging",
        "preferred_method": "Sprinkler",
        "efficiency_default": 0.75
    },
    "Turmeric": {
        "name": "Turmeric",
        "stages": {
            "Sprouting & Emergence": {"kc": 0.50, "root_depth_m": 0.20, "p": 0.40},
            "Vegetative Growth": {"kc": 0.85, "root_depth_m": 0.35, "p": 0.40},
            "Rhizome Development": {"kc": 1.10, "root_depth_m": 0.50, "p": 0.35},
            "Rhizome Maturation": {"kc": 0.70, "root_depth_m": 0.50, "p": 0.50}
        },
        "default_stage": "Vegetative Growth",
        "preferred_method": "Drip System",
        "efficiency_default": 0.88
    },
    "Sugarcane": {
        "name": "Sugarcane",
        "stages": {
            "Germination & Tillering": {"kc": 0.50, "root_depth_m": 0.30, "p": 0.50},
            "Formative Stage / Canopy Dev": {"kc": 0.90, "root_depth_m": 0.70, "p": 0.50},
            "Grand Growth Stage": {"kc": 1.25, "root_depth_m": 1.20, "p": 0.50},
            "Ripening / Sucrose Accumulation": {"kc": 0.75, "root_depth_m": 1.20, "p": 0.65}
        },
        "default_stage": "Formative Stage / Canopy Dev",
        "preferred_method": "Drip System",
        "efficiency_default": 0.85
    },
    "Tomato": {
        "name": "Tomato",
        "stages": {
            "Initial": {"kc": 0.50, "root_depth_m": 0.25, "p": 0.40},
            "Vegetative Stage": {"kc": 0.80, "root_depth_m": 0.45, "p": 0.40},
            "Flowering & Fruiting": {"kc": 1.15, "root_depth_m": 0.60, "p": 0.35},
            "Harvesting": {"kc": 0.80, "root_depth_m": 0.60, "p": 0.45}
        },
        "default_stage": "Vegetative Stage",
        "preferred_method": "Drip System",
        "efficiency_default": 0.90
    },
    "Onion": {
        "name": "Onion",
        "stages": {
            "Initial": {"kc": 0.50, "root_depth_m": 0.20, "p": 0.30},
            "Vegetative Stage": {"kc": 0.75, "root_depth_m": 0.30, "p": 0.30},
            "Bulb Initiation & Swelling": {"kc": 1.05, "root_depth_m": 0.40, "p": 0.30},
            "Bulb Maturation": {"kc": 0.70, "root_depth_m": 0.40, "p": 0.50}
        },
        "default_stage": "Vegetative Stage",
        "preferred_method": "Drip System",
        "efficiency_default": 0.88
    },
    "Pulses": {
        "name": "Pulses (Green / Black / Red Gram)",
        "stages": {
            "Initial / Emergence": {"kc": 0.40, "root_depth_m": 0.25, "p": 0.60},
            "Vegetative & Branching": {"kc": 0.75, "root_depth_m": 0.50, "p": 0.60},
            "Flowering & Pod Fill": {"kc": 1.05, "root_depth_m": 0.70, "p": 0.55},
            "Maturity": {"kc": 0.50, "root_depth_m": 0.70, "p": 0.70}
        },
        "default_stage": "Vegetative & Branching",
        "preferred_method": "Sprinkler",
        "efficiency_default": 0.75
    }
}

# Alias for legacy references
CROP_WATER_SPECS = FAO_CROP_PARAMETERS

# Soil Available Water Capacity (AWC in mm water per meter soil depth)
SOIL_WATER_HOLDING_CAPACITY: Dict[str, float] = {
    "coarse sand": 70.0,
    "sandy loam": 120.0,
    "loam": 160.0,
    "loamy": 160.0,
    "alluvial": 165.0,
    "clay loam": 185.0,
    "black cotton": 200.0,
    "clay": 175.0,
    "red sandy": 110.0
}

# Irrigation system application efficiencies
SYSTEM_EFFICIENCIES: Dict[str, float] = {
    "drip": 0.90,
    "drip system": 0.90,
    "sprinkler": 0.75,
    "canal": 0.60,
    "canal / furrow": 0.60,
    "basin": 0.60,
    "surface": 0.55,
    "flood": 0.50,
    "tank / pond": 0.60,
    "borewell": 0.70
}


def calculate_etc(eto: float, kc: float) -> float:
    """Calculates crop evapotranspiration ETc = Kc * ETo (FAO-56)."""
    return round(eto * kc, 3)


def estimate_effective_rainfall_usda(forecast_rainfall_mm: float) -> float:
    """
    Estimates usable effective rainfall (P_eff) using FAO / USDA SCS method.
    Light showers (<= 4 mm) evaporate before infiltrating root zone;
    Heavy torrential rain loses a percentage to surface runoff.
    """
    if forecast_rainfall_mm <= 4.0:
        return 0.0
    elif forecast_rainfall_mm <= 50.0:
        p_eff = (forecast_rainfall_mm * 0.8) - 3.2
        return round(max(0.0, p_eff), 1)
    else:
        p_eff = (50.0 * 0.8 - 3.2) + (forecast_rainfall_mm - 50.0) * 0.4
        return round(p_eff, 1)


def calculate_volumetric_water(
    net_depth_mm: float,
    area_ha: Optional[float] = None,
    acreage: Optional[float] = None,
    efficiency: float = 0.80
) -> Dict[str, Any]:
    """
    Computes net and gross volumetric water requirements.
    1 mm over 1 ha = 10 m3 (10,000 liters).
    Gross = Net / efficiency.
    """
    if area_ha is None:
        if acreage is not None:
            area_ha = acreage * 0.404686
        else:
            area_ha = 1.0

    net_vol_m3 = round(net_depth_mm * area_ha * 10.0, 2)
    gross_vol_m3 = round(net_vol_m3 / efficiency, 2) if efficiency > 0 else net_vol_m3
    gross_depth_mm = round(net_depth_mm / efficiency, 2) if efficiency > 0 else net_depth_mm

    return {
        "net_volume_m3": net_vol_m3,
        "gross_volume_m3": gross_vol_m3,
        "net_depth_mm": round(net_depth_mm, 2),
        "gross_depth_mm": gross_depth_mm,
        "net_liters": int(net_vol_m3 * 1000),
        "gross_liters": int(gross_vol_m3 * 1000),
        "area_ha": area_ha
    }


def calculate_pump_runtime_hours(gross_volume_m3: float, pump_flow_rate_m3_hr: float) -> float:
    """
    Computes required pump run duration in hours: Volume (m3) / Flow Rate (m3/hr).
    """
    if pump_flow_rate_m3_hr <= 0:
        return 0.0
    return round(gross_volume_m3 / pump_flow_rate_m3_hr, 2)


class IrrigationService:
    def get_crop_params(self, crop: str) -> Dict[str, Any]:
        key = crop.strip().title()
        if key in FAO_CROP_PARAMETERS:
            return FAO_CROP_PARAMETERS[key]
        for name, params in FAO_CROP_PARAMETERS.items():
            if name.lower() in key.lower() or key.lower() in name.lower():
                return params
        if any(w in key.lower() for w in ["gram", "pulse", "dal", "bean", "urad", "moong"]):
            return FAO_CROP_PARAMETERS["Pulses"]
        return FAO_CROP_PARAMETERS["Maize"]

    def estimate_reference_et0(
        self,
        temp_c: float = 32.0,
        temp_min_c: float = 24.0,
        temp_max_c: float = 35.0,
        humidity_percent: float = 65.0,
        wind_speed_kmh: float = 12.0,
        radiation_factor: float = 1.0
    ) -> float:
        """
        Estimates daily reference evapotranspiration ETo (mm/day)
        Uses FAO Penman-Monteith / Hargreaves-Samani formulation.
        In semi-arid and tropical India, daily ETo typically ranges from 3.5 to 7.0 mm/day.
        """
        # Hargreaves-Samani approximation calibrated for Andhra Pradesh delta zone
        t_mean = (temp_max_c + temp_min_c) / 2.0
        t_range = max(1.0, temp_max_c - temp_min_c)
        # Ra (extraterrestrial solar radiation for ~16°N latitude ~ 15 mm/day equivalent)
        ra_mm_day = 14.8 * radiation_factor
        eto_raw = 0.0023 * (t_mean + 17.8) * math.sqrt(t_range) * ra_mm_day

        # Wind & humidity adjustment: High humidity lowers ETo; high wind increases it
        humidity_adj = 1.0 - (humidity_percent - 50.0) * 0.004
        wind_adj = 1.0 + (wind_speed_kmh - 10.0) * 0.01
        eto = eto_raw * max(0.7, min(1.3, humidity_adj * wind_adj))

        # Clamp to realistic physical range
        return round(max(2.5, min(9.0, eto)), 2)

    def calculate_effective_rainfall(self, forecast_rainfall_mm: float) -> float:
        """
        Estimates usable effective rainfall (P_eff) using FAO / USDA SCS method.
        Light showers (< 4 mm) evaporate before infiltrating root zone;
        Heavy torrential rain loses a percentage to surface runoff.
        """
        if forecast_rainfall_mm <= 4.0:
            return 0.0
        elif forecast_rainfall_mm <= 50.0:
            p_eff = (forecast_rainfall_mm * 0.8) - 3.2
            return round(max(0.0, p_eff), 1)
        else:
            # Over 50 mm, infiltration rate limits effective absorption
            p_eff = (50.0 * 0.8 - 3.2) + (forecast_rainfall_mm - 50.0) * 0.4
            return round(p_eff, 1)

    def calculate_plan(
        self,
        crop: str,
        acreage: float,
        water_source: str,
        stage: str = "Vegetative Stage",
        soil_type: str = "Loamy",
        irrigation_method: Optional[str] = None,
        application_efficiency: Optional[float] = None,
        pump_flow_rate_m3_hr: float = 30.0,
        measured_soil_moisture: Optional[float] = None,
        weather: Optional[Dict[str, Any]] = None,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Generates full FAO-56 compliant water balance and irrigation plan.
        """
        # Validate inputs
        if acreage <= 0:
            acreage = 2.5

        crop_params = self.get_crop_params(crop)
        stages = crop_params["stages"]

        # Match stage to Kc
        matched_stage_key = None
        for s_key in stages.keys():
            if stage.lower() in s_key.lower() or s_key.lower() in stage.lower():
                matched_stage_key = s_key
                break
        if not matched_stage_key:
            matched_stage_key = list(stages.keys())[1]  # default to 2nd stage (vegetative)

        stage_data = stages[matched_stage_key]
        kc = stage_data["kc"]
        root_depth_m = stage_data["root_depth_m"]
        p_depletion = stage_data["p"]

        # Weather variables
        curr_temp = 32.0
        min_temp = 24.0
        max_temp = 34.0
        humidity = 65.0
        wind_speed = 12.0
        forecast_rain_7d = 0.0

        if weather:
            curr_temp = float(weather.get("current_temp", curr_temp))
            min_temp = float(weather.get("min_temp", min_temp))
            max_temp = float(weather.get("max_temp", max_temp))
            humidity = float(weather.get("humidity", humidity))
            wind_speed = float(weather.get("wind_speed", wind_speed))
            if "forecast" in weather and weather["forecast"]:
                forecast_rain_7d = sum(f.get("precipitation_sum", 0.0) for f in weather["forecast"][:7])

        # 1. Reference ETo (mm/day)
        daily_eto = self.estimate_reference_et0(
            temp_c=curr_temp,
            temp_min_c=min_temp,
            temp_max_c=max_temp,
            humidity_percent=humidity,
            wind_speed_kmh=wind_speed
        )

        # 2. Crop Evapotranspiration ETc (mm/day)
        daily_etc = round(daily_eto * kc, 2)

        # 3. Soil Water Storage (TAW and RAW)
        norm_soil = soil_type.strip().lower()
        awc = SOIL_WATER_HOLDING_CAPACITY.get(norm_soil, 160.0)
        taw_mm = round(awc * root_depth_m, 1)  # Total available water in root zone
        raw_mm = round(taw_mm * p_depletion, 1)  # Readily available water before stress occurs

        # 4. Effective Rainfall (mm) over next 3-4 days
        rain_next_4d = round(forecast_rain_7d * 0.6, 1)
        effective_rain_mm = self.calculate_effective_rainfall(rain_next_4d)

        # 5. Determine Soil Moisture Depletion
        # If farmer entered real/manual sensor moisture:
        sensor_active = False
        if measured_soil_moisture is not None and 10.0 <= measured_soil_moisture <= 50.0:
            sensor_active = True
            # Moisture deficit based on measurement (assuming field capacity ~ 32% for loam)
            field_capacity_pct = 32.0
            deficit_pct = max(0.0, field_capacity_pct - measured_soil_moisture)
            current_depletion_mm = round((deficit_pct / 100.0) * root_depth_m * 1000.0, 1)
        else:
            # Model-based estimate (accumulated over cycle frequency)
            # Cycle interval days ~ RAW / ETc
            cycle_days = max(3, min(7, round(raw_mm / max(1.0, daily_etc))))
            current_depletion_mm = round(raw_mm * 0.85, 1)

        # 6. Net Irrigation Requirement (mm)
        # Net depth = max(0, depletion - effective_rain)
        net_depth_mm = max(0.0, current_depletion_mm - effective_rain_mm)

        # If Paddy in vegetative stage, add standing water requirement
        if crop.strip().lower() == "paddy" and "vegetative" in matched_stage_key.lower():
            net_depth_mm = max(net_depth_mm, crop_params.get("standing_water_depth_mm", 25.0))
        elif net_depth_mm < 5.0 and effective_rain_mm >= current_depletion_mm:
            net_depth_mm = 0.0  # Postpone irrigation due to sufficient rain
        else:
            net_depth_mm = max(10.0, round(net_depth_mm, 1))

        # 7. System Efficiency & Gross Irrigation Depth (mm)
        chosen_method = irrigation_method or crop_params.get("preferred_method", "Drip System")
        norm_method = chosen_method.strip().lower()

        if application_efficiency is not None and 0.40 <= application_efficiency <= 0.98:
            efficiency = application_efficiency
        else:
            efficiency = SYSTEM_EFFICIENCIES.get(norm_method, 0.85)

        gross_depth_mm = round(net_depth_mm / efficiency, 1) if net_depth_mm > 0 else 0.0

        # 8. Volumetric Calculations
        # 1 mm over 1 hectare = 10 m3
        # 1 acre = 0.404686 hectares
        area_ha = acreage * 0.404686
        net_volume_m3 = round(net_depth_mm * area_ha * 10.0, 1)
        gross_volume_m3 = round(gross_depth_mm * area_ha * 10.0, 1)

        net_liters = net_volume_m3 * 1000.0
        gross_liters = gross_volume_m3 * 1000.0
        gross_lakh_liters = round(gross_liters / 100000.0, 2)

        # 9. Pump Run-Time Duration
        pump_flow = max(5.0, pump_flow_rate_m3_hr)
        run_hours = round(gross_volume_m3 / pump_flow, 2) if gross_volume_m3 > 0 else 0.0
        hours_part = int(run_hours)
        mins_part = int(round((run_hours - hours_part) * 60))
        duration_label = f"{hours_part}h {mins_part}m" if hours_part > 0 else f"{mins_part} minutes"

        # 10. Irrigation Scheduling & Next Date
        today = datetime.date.today()
        if net_depth_mm == 0.0:
            next_date_label = "Postpone 3–4 Days (Rain Expected)"
            urgency = "postpone"
            headline_reason = f"Postpone irrigation: Forecast rainfall ({forecast_rain_7d:.1f} mm) provides {effective_rain_mm:.1f} mm usable moisture, meeting crop ET demand."
        elif current_depletion_mm >= raw_mm:
            next_date_label = "Today, 06:30 AM"
            urgency = "high"
            headline_reason = f"Immediate irrigation required: Root-zone depletion ({current_depletion_mm:.1f} mm) has reached the readily available threshold ({raw_mm:.1f} mm)."
        else:
            next_day = today + datetime.timedelta(days=1)
            next_date_label = f"Tomorrow ({next_day.strftime('%d %b')}), 06:30 AM"
            urgency = "normal"
            headline_reason = f"Normal scheduled irrigation: Daily ETc is {daily_etc:.1f} mm/day under current {curr_temp:.0f}°C ambient temperature."

        if language != "en":
            loc_advice = localization_service.localize_irrigation_advice(
                action=urgency,
                pump_mins=int(run_hours * 60),
                water_saved_liters=int(saved_volume_m3 * 1000) if 'saved_volume_m3' in locals() else 50000,
                soil_status="optimal" if net_depth_mm == 0 else "needs_water",
                lang=language
            )
            headline_reason = loc_advice["message"]

        optimal_window = "06:00 AM – 08:30 AM (Morning) or 05:30 PM – 07:30 PM (Evening)"
        window_rationale = "Mid-day irrigation loses up to 25% water to atmospheric vapor drift. Early morning application ensures deep root absorption before solar radiation peaks."

        # 11. Water-Saving Analysis (Baseline vs Weather-Adjusted)
        # Baseline = Traditional unmonitored flood practice (typically 45-50 mm fixed per watering)
        baseline_depth_mm = 50.0
        baseline_gross_depth = round(baseline_depth_mm / 0.55, 1)  # 55% surface efficiency
        baseline_volume_m3 = round(baseline_gross_depth * area_ha * 10.0, 1)
        saved_volume_m3 = max(0.0, round(baseline_volume_m3 - gross_volume_m3, 1))
        saving_percent = round((saved_volume_m3 / baseline_volume_m3) * 100.0, 1) if baseline_volume_m3 > 0 else 0.0

        water_saving_analysis = {
            "baseline_volume_m3": baseline_volume_m3,
            "baseline_liters": round(baseline_volume_m3 * 1000.0),
            "adjusted_volume_m3": gross_volume_m3,
            "adjusted_liters": round(gross_liters),
            "saved_volume_m3": saved_volume_m3,
            "saved_liters": round(saved_volume_m3 * 1000.0),
            "saving_percentage": saving_percent,
            "assumptions": f"Compared against traditional flood irrigation (50 mm depth @ 55% efficiency) on {acreage} acres."
        }

        # 12. Irrigation Method Comparison
        method_comparison = [
            {
                "method": "Drip Irrigation",
                "efficiency_percent": 90,
                "gross_depth_mm": round(net_depth_mm / 0.90, 1) if net_depth_mm > 0 else 0.0,
                "gross_volume_m3": round((net_depth_mm / 0.90) * area_ha * 10.0, 1) if net_depth_mm > 0 else 0.0,
                "water_loss_percent": 10,
                "suitability": "Highest Efficiency — Recommended for row crops & orchards",
                "energy_cost_index": "Low"
            },
            {
                "method": "Sprinkler Irrigation",
                "efficiency_percent": 75,
                "gross_depth_mm": round(net_depth_mm / 0.75, 1) if net_depth_mm > 0 else 0.0,
                "gross_volume_m3": round((net_depth_mm / 0.75) * area_ha * 10.0, 1) if net_depth_mm > 0 else 0.0,
                "water_loss_percent": 25,
                "suitability": "Moderate Efficiency — Best for Groundnut, Pulses & undulating terrain",
                "energy_cost_index": "Medium"
            },
            {
                "method": "Surface / Canal Basin",
                "efficiency_percent": 58,
                "gross_depth_mm": round(net_depth_mm / 0.58, 1) if net_depth_mm > 0 else 0.0,
                "gross_volume_m3": round((net_depth_mm / 0.58) * area_ha * 10.0, 1) if net_depth_mm > 0 else 0.0,
                "water_loss_percent": 42,
                "suitability": "Low Efficiency — Suitable for flooded Paddy; high deep percolation loss",
                "energy_cost_index": "High Water Loss"
            }
        ]

        # Sensor disclosure
        sensor_status_msg = (
            f"Sensor verified: Manual VWC moisture recorded at {measured_soil_moisture:.1f}%."
            if sensor_active
            else "Sensor not connected — recommendations are based on FAO-56 weather and soil-water balance estimates."
        )

        if language == "te":
            window_rationale = "మధ్యాహ్న సమయంలో నీరు పెడితే 25% వరకు ఆవిరైపోతుంది. తెల్లవారుజామున లేదా సాయంత్రం వేళల్లో నీరు పెట్టడం వల్ల వేర్లకు పూర్తిగా అందుతుంది."
            advice_list = [
                f"నీరు ఆవిరి కాకుండా నివారించడానికి {optimal_window} లోపు నీటిపారుదల పూర్తి చేయండి.",
                f"డ్రిప్ పైపులు మరియు గట్ల వద్ద నీటి లీకేజీలు లేకుండా చూసుకోండి.",
                "నత్రజని ఎరువులు వేసే ముందు పొలంలో అదనపు నీరు నిల్వ ఉండకుండా చూసుకోండి."
            ]
        elif language == "hi":
            window_rationale = "दोपहर के समय सिंचाई करने से 25% तक पानी वाष्पीकृत हो जाता है। सुबह या शाम को सिंचाई करने से जड़ों को पूरा लाभ मिलता है।"
            advice_list = [
                f"पानी का वाष्पीकरण रोकने के लिए {optimal_window} में सिंचाई करें।",
                f"ड्रिप पाइप और मेड़ों से पानी का रिसाव रोकें।",
                "उर्वरक देने से पहले खेत में अत्यधिक जलजमाव न होने दें।"
            ]
        elif language == "ta":
            advice_list = [
                f"நீர்ப்பாசனத்தை {optimal_window} நேரத்தில் வழங்கவும்.",
                "கசிவுகளை தவிர்த்து நீர் விரயத்தை குறைக்கவும்.",
                "உரம் இடுவதற்கு முன் தேங்கிய நீரை வடிக்கவும்."
            ]
        elif language == "kn":
            advice_list = [
                f"ನೀರಿನ ಆವಿಯಾಗುವಿಕೆಯನ್ನು ತಡೆಯಲು {optimal_window} ಸಮಯದಲ್ಲಿ ನೀರಾವರಿ ಮಾಡಿ.",
                "ಹನಿ ನೀರಾವರಿ ಪೈಪ್‌ಗಳಲ್ಲಿ ಸೋರಿಕೆಯನ್ನು ತಡೆಗಟ್ಟಿ.",
                "ಗೊಬ್ಬರ ಹಾಕುವ ಮೊದಲು ಹೆಚ್ಚುವರಿ ನೀರನ್ನು ಹೊರಹಾಕಿ."
            ]
        elif language == "mr":
            advice_list = [
                f"पाण्याचे बाष्पीभवन टाळण्यासाठी {optimal_window} वेळेत सिंचन करा.",
                "ठिबक नळ्यांमधून पाण्याची गळती रोखा.",
                "खते देण्यापूर्वी शेतातील साचलेले पाणी बाहेर काढा."
            ]
        else:
            advice_list = [
                f"Apply irrigation within {optimal_window} to prevent high evaporative loss.",
                f"Ensure bunds and drip laterals have zero leakages to preserve {int(efficiency * 100)}% delivery efficiency.",
                "Drain excessive water from furrows before top-dressing nitrogen fertilizers."
            ]

        return {
            "crop": crop,
            "growth_stage": matched_stage_key,
            "kc": kc,
            "acreage": acreage,
            "area_hectares": round(area_ha, 3),
            "soil_type": soil_type,
            "water_source": water_source,
            "irrigation_method": chosen_method,
            "application_efficiency": efficiency,
            "fao_calculation": {
                "daily_eto_mm": daily_eto,
                "daily_etc_mm": daily_etc,
                "root_depth_m": root_depth_m,
                "taw_mm": taw_mm,
                "raw_mm": raw_mm,
                "soil_depletion_mm": current_depletion_mm,
                "effective_rain_mm": effective_rain_mm,
                "net_depth_mm": net_depth_mm,
                "gross_depth_mm": gross_depth_mm,
                "calculation_method": "FAO-56 Penman-Monteith & Water Balance Model"
            },
            "net_depth_mm": net_depth_mm,
            "gross_depth_mm": gross_depth_mm,
            "depth_min": max(15, round(net_depth_mm * 0.9)),
            "depth_max": max(20, round(gross_depth_mm * 1.1)),
            "water_volume_m3": gross_volume_m3,
            "water_volume_liters": round(gross_liters),
            "water_volume_lakh_liters": gross_lakh_liters,
            "volume_label": f"≈ {gross_lakh_liters} lakh liters ({int(gross_volume_m3)} m³) for {acreage} acres",
            "pump_duration_hours": run_hours,
            "pump_duration_label": duration_label,
            "pump_flow_rate_assumed": f"{pump_flow} m³/hr",
            "next_date": next_date_label,
            "urgency": urgency,
            "optimal_window": optimal_window,
            "window_rationale": window_rationale,
            "why_recommendation": headline_reason,
            "weather_snapshot": {
                "temp": curr_temp,
                "humidity": humidity,
                "wind_speed": wind_speed,
                "forecast_rain_7d": forecast_rain_7d,
                "effective_rain_expected": effective_rain_mm
            },
            "water_saving": water_saving_analysis,
            "method_comparison": method_comparison,
            "sensor_info": {
                "sensor_connected": sensor_active,
                "message": sensor_status_msg,
                "reading_value": measured_soil_moisture if sensor_active else None
            },
            "additional_advice": advice_list,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }


irrigation_service = IrrigationService()
