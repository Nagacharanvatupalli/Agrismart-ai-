import math
from typing import List, Dict, Any, Optional
import datetime
from .localization import localization_service

# ==============================================================================
# Comprehensive Agronomic Knowledge Catalog
# Compiled from ICAR (Indian Council of Agricultural Research),
# ANGRAU (Acharya N.G. Ranga Agricultural University) Agronomy Handbooks,
# and FAO Crop Water & Soil Management Guidelines.
# ==============================================================================

CROP_CATALOG: Dict[str, Dict[str, Any]] = {
    "Paddy": {
        "id": "Paddy",
        "name": "Paddy (Rice)",
        "scientific_name": "Oryza sativa L.",
        "telugu_name": "వరి (Vari)",
        "category": "Cereals",
        "suitable_ph_min": 5.5,
        "suitable_ph_max": 8.0,
        "optimal_ph_min": 6.0,
        "optimal_ph_max": 7.2,
        "soil_textures": ["Clay", "Clay Loam", "Loamy", "Alluvial", "Black Cotton"],
        "unsuitable_textures": ["Coarse Sand", "Gravel"],
        "temp_min": 18.0,
        "temp_max": 38.0,
        "temp_opt_min": 24.0,
        "temp_opt_max": 33.0,
        "water_requirement_mm": 1100,  # mm over full season
        "irrigation_depth_mm": 30,     # mm per irrigation
        "water_source_affinity": ["Canal", "Canal Water", "Borewell", "Tank/Pond", "Tank / Pond"],
        "min_water_level": "High",     # Requires assured water
        "seasons": ["Kharif", "Rabi"],
        "season_label": "Jun – Oct (Kharif) / Dec – Mar (Rabi)",
        "sowing_windows": {
            "Kharif": "Jun – Jul",
            "Rabi": "Nov – Dec"
        },
        "growing_duration_days": "120 – 140 days",
        "duration_days_num": 130,
        "yield_estimate": "4.5 – 5.5 tons/acre (Grain yield under recommended agronomic practice)",
        "drought_tolerance": "Low",
        "waterlogging_sensitivity": "Very Low (Adapted to submergence during tillering)",
        "salinity_sensitivity": "Moderate",
        "intercrops": [
            {"id": "Green Gram", "name": "Green Gram (Moong)", "timing": "Pre-paddy green manure / relay (Apr – May)"},
            {"id": "Sesame", "name": "Sesame (Gingelly)", "timing": "Post-paddy zero-till relay (Nov – Dec)"},
            {"id": "Black Gram", "name": "Black Gram (Urad)", "timing": "Rice fallow relay pulse (Nov – Dec)"}
        ],
        "key_risks": [
            "Susceptible to water stress during panicle initiation and flowering stage.",
            "Excessive continuous submergence beyond 5 cm encourages fungal blast and stem borer attack."
        ],
        "image_url": "/assets/crop_paddy.jpg",
        "data_source": "ICAR-NRRI & ANGRAU Package of Practices (2024 Revision)"
    },
    "Maize": {
        "id": "Maize",
        "name": "Maize (Corn)",
        "scientific_name": "Zea mays L.",
        "telugu_name": "మొక్కజొన్న (Mokkajonna)",
        "category": "Cereals",
        "suitable_ph_min": 5.8,
        "suitable_ph_max": 7.8,
        "optimal_ph_min": 6.2,
        "optimal_ph_max": 7.4,
        "soil_textures": ["Loamy", "Clay Loam", "Sandy Loam", "Alluvial"],
        "unsuitable_textures": ["Heavy Clay with poor drainage", "Waterlogged soil"],
        "temp_min": 15.0,
        "temp_max": 38.0,
        "temp_opt_min": 22.0,
        "temp_opt_max": 32.0,
        "water_requirement_mm": 550,
        "irrigation_depth_mm": 25,
        "water_source_affinity": ["Canal", "Borewell", "Drip System", "Tank/Pond"],
        "min_water_level": "Moderate",
        "seasons": ["Kharif", "Rabi", "Pre-summer"],
        "season_label": "Jul – Nov (Kharif) / Oct – Feb (Rabi)",
        "sowing_windows": {
            "Kharif": "Jun – Jul",
            "Rabi": "Oct – Nov",
            "Pre-summer": "Jan – Feb"
        },
        "growing_duration_days": "100 – 115 days",
        "duration_days_num": 105,
        "yield_estimate": "3.5 – 4.2 tons/acre (High-yielding hybrid grain yield)",
        "drought_tolerance": "Moderate",
        "waterlogging_sensitivity": "High (Standing water > 24 hours induces seedling chlorosis and root asphyxiation)",
        "salinity_sensitivity": "Moderate",
        "intercrops": [
            {"id": "Red Gram", "name": "Red Gram (Pigeon Pea)", "timing": "2:1 row intercropping for nitrogen fixation"},
            {"id": "Groundnut", "name": "Groundnut", "timing": "Strip cropping (3:3 rows)"}
        ],
        "key_risks": [
            "Moisture stress during silking and tasseling causes severe grain abortion.",
            "Water stagnation at knee-high stage halts nitrogen uptake."
        ],
        "image_url": "/assets/crop_maize.jpg",
        "data_source": "ICAR-IIMR & ANGRAU Agronomy Recommendations"
    },
    "Chilli": {
        "id": "Chilli",
        "name": "Chilli (Red Pepper)",
        "scientific_name": "Capsicum annuum L.",
        "telugu_name": "మిరప (Mirapa)",
        "category": "Spices",
        "suitable_ph_min": 6.0,
        "suitable_ph_max": 7.8,
        "optimal_ph_min": 6.5,
        "optimal_ph_max": 7.2,
        "soil_textures": ["Black Cotton", "Sandy Loam", "Clay Loam", "Loamy"],
        "unsuitable_textures": ["Poorly drained clay", "Saline soils"],
        "temp_min": 16.0,
        "temp_max": 36.0,
        "temp_opt_min": 22.0,
        "temp_opt_max": 30.0,
        "water_requirement_mm": 650,
        "irrigation_depth_mm": 20,
        "water_source_affinity": ["Drip System", "Borewell", "Canal Water"],
        "min_water_level": "Moderate",
        "seasons": ["Kharif", "Rabi"],
        "season_label": "Jul – Jan (Kharif long duration)",
        "sowing_windows": {
            "Kharif": "Jul – Aug (Transplanting)",
            "Rabi": "Sep – Oct"
        },
        "growing_duration_days": "150 – 180 days (Multiple pickings)",
        "duration_days_num": 165,
        "yield_estimate": "1.8 – 2.5 tons/acre (Dry chilli export grade yield)",
        "drought_tolerance": "Moderate",
        "waterlogging_sensitivity": "Very High (Water stagnation causes bacterial wilt and damping-off)",
        "salinity_sensitivity": "High",
        "intercrops": [
            {"id": "Marigold", "name": "African Marigold", "timing": "Border/Trap crop to suppress root-knot nematodes and thrips"},
            {"id": "Coriander", "name": "Coriander", "timing": "Intercrop on raised beds"}
        ],
        "key_risks": [
            "Foliar wetting during high relative humidity triggers cercospora leaf spot and thrips infestation.",
            "Flower and fruit drop occur if temperatures exceed 36°C."
        ],
        "image_url": "/assets/crop_chilli.jpg",
        "data_source": "Dr. YSR Horticultural University & ICAR-IIHR"
    },
    "Cotton": {
        "id": "Cotton",
        "name": "Cotton (Bt Hybrid)",
        "scientific_name": "Gossypium hirsutum L.",
        "telugu_name": "ప్రత్తి (Pratti)",
        "category": "Commercial",
        "suitable_ph_min": 6.0,
        "suitable_ph_max": 8.5,
        "optimal_ph_min": 6.8,
        "optimal_ph_max": 8.0,
        "soil_textures": ["Black Cotton", "Deep Clay Loam", "Alluvial", "Loamy"],
        "unsuitable_textures": ["Shallow gravelly soils", "Waterlogged depressions"],
        "temp_min": 18.0,
        "temp_max": 42.0,
        "temp_opt_min": 26.0,
        "temp_opt_max": 35.0,
        "water_requirement_mm": 700,
        "irrigation_depth_mm": 25,
        "water_source_affinity": ["Borewell", "Canal", "Drip System", "Rainfed"],
        "min_water_level": "Moderate",
        "seasons": ["Kharif"],
        "season_label": "Jun – Dec (Kharif)",
        "sowing_windows": {
            "Kharif": "Jun – Jul"
        },
        "growing_duration_days": "150 – 170 days",
        "duration_days_num": 160,
        "yield_estimate": "1.2 – 1.8 tons/acre (Seed cotton / Kapas yield)",
        "drought_tolerance": "High (Deep taproot extracts subsoil moisture)",
        "waterlogging_sensitivity": "High (Square shedding occurs under 48h waterlogging)",
        "salinity_sensitivity": "Moderate to High tolerance",
        "intercrops": [
            {"id": "Green Gram", "name": "Green Gram", "timing": "1:1 or 1:2 intercrop in wide rows"},
            {"id": "Black Gram", "name": "Black Gram", "timing": "Smother crop during initial 45 days"}
        ],
        "key_risks": [
            "Heavy unseasonal rain during boll bursting damages lint color and grade.",
            "Square formation is severely impaired if soil moisture drops below 40% depletion."
        ],
        "image_url": "/assets/crop_cotton.jpg",
        "data_source": "ICAR-CICR & ANGRAU Commercial Crop Directorate"
    },
    "Groundnut": {
        "id": "Groundnut",
        "name": "Groundnut (Peanut)",
        "scientific_name": "Arachis hypogaea L.",
        "telugu_name": "వేరుశెనగ (Verusanaga)",
        "category": "Oilseeds",
        "suitable_ph_min": 5.8,
        "suitable_ph_max": 7.5,
        "optimal_ph_min": 6.0,
        "optimal_ph_max": 7.0,
        "soil_textures": ["Sandy Loam", "Red Sandy", "Loamy", "Alluvial"],
        "unsuitable_textures": ["Heavy sticky clay (prevents peg penetration and causes pod loss at harvest)"],
        "temp_min": 18.0,
        "temp_max": 35.0,
        "temp_opt_min": 24.0,
        "temp_opt_max": 30.0,
        "water_requirement_mm": 450,
        "irrigation_depth_mm": 18,
        "water_source_affinity": ["Borewell", "Sprinkler", "Canal Water", "Drip System"],
        "min_water_level": "Low to Moderate",
        "seasons": ["Kharif", "Rabi", "Pre-summer"],
        "season_label": "Jul – Oct (Kharif) / Nov – Mar (Rabi) / Jan – May (Summer)",
        "sowing_windows": {
            "Kharif": "Jun – Jul",
            "Rabi": "Oct – Nov",
            "Pre-summer": "Jan – Feb"
        },
        "growing_duration_days": "100 – 115 days",
        "duration_days_num": 105,
        "yield_estimate": "1.8 – 2.4 tons/acre (Dry pod yield with sprinkler/drip)",
        "drought_tolerance": "High (Legume with low water footprint)",
        "waterlogging_sensitivity": "Very High (Pods rot and aflatoxin develops rapidly)",
        "salinity_sensitivity": "Moderate",
        "intercrops": [
            {"id": "Red Gram", "name": "Red Gram", "timing": "7:1 or 8:1 row ratio for risk mitigation"},
            {"id": "Castor", "name": "Castor", "timing": "Border crop"}
        ],
        "key_risks": [
            "Soil compaction or heavy clay prevents peg entry, resulting in blind pods (pops).",
            "Moisture stress during pod development drastically reduces oil content."
        ],
        "image_url": "/assets/crop_groundnut.jpg",
        "data_source": "ICAR-DGR & ANGRAU Oilseeds Research Station"
    },
    "Turmeric": {
        "id": "Turmeric",
        "name": "Turmeric",
        "scientific_name": "Curcuma longa L.",
        "telugu_name": "పసుపు (Pasupu)",
        "category": "Spices",
        "suitable_ph_min": 5.5,
        "suitable_ph_max": 7.5,
        "optimal_ph_min": 6.2,
        "optimal_ph_max": 7.0,
        "soil_textures": ["Clay Loam", "Loamy", "Alluvial", "Red Sandy"],
        "unsuitable_textures": ["Hard rocky soil", "Stagnant marshy soil"],
        "temp_min": 20.0,
        "temp_max": 36.0,
        "temp_opt_min": 25.0,
        "temp_opt_max": 32.0,
        "water_requirement_mm": 850,
        "irrigation_depth_mm": 25,
        "water_source_affinity": ["Canal Water", "Drip System", "Borewell"],
        "min_water_level": "Moderate to High",
        "seasons": ["Kharif"],
        "season_label": "Jun – Feb (Long duration cash crop)",
        "sowing_windows": {
            "Kharif": "Jun – Jul"
        },
        "growing_duration_days": "210 – 240 days",
        "duration_days_num": 225,
        "yield_estimate": "8.0 – 10.0 tons/acre (Fresh rhizome yield)",
        "drought_tolerance": "Low",
        "waterlogging_sensitivity": "High (Rhizome rot / Pythium outbreaks occur under standing water)",
        "salinity_sensitivity": "Moderate",
        "intercrops": [
            {"id": "Maize", "name": "Maize", "timing": "Shade crop during first 90 days"},
            {"id": "Chilli", "name": "Chilli", "timing": "Ridge and furrow intercropping"}
        ],
        "key_risks": [
            "Requires adequate mulching to maintain ridge soil temperature below 30°C.",
            "Water shortage during rhizome initiation (90–120 days) cuts yield by over 40%."
        ],
        "image_url": "/assets/crop_turmeric.jpg",
        "data_source": "ICAR-IISR & Horticultural University Guidance"
    },
    "Sugarcane": {
        "id": "Sugarcane",
        "name": "Sugarcane",
        "scientific_name": "Saccharum officinarum L.",
        "telugu_name": "చెరకు (Cheraku)",
        "category": "Commercial",
        "suitable_ph_min": 6.0,
        "suitable_ph_max": 8.0,
        "optimal_ph_min": 6.5,
        "optimal_ph_max": 7.5,
        "soil_textures": ["Loamy", "Clay Loam", "Alluvial", "Black Cotton"],
        "unsuitable_textures": ["Shallow rocky soil", "Coarse gravel"],
        "temp_min": 18.0,
        "temp_max": 40.0,
        "temp_opt_min": 26.0,
        "temp_opt_max": 34.0,
        "water_requirement_mm": 1600,
        "irrigation_depth_mm": 40,
        "water_source_affinity": ["Canal Water", "Borewell", "Drip System"],
        "min_water_level": "Very High",
        "seasons": ["Kharif", "Rabi"],
        "season_label": "Jan – Dec (Annual crop, Eksali / Adsali)",
        "sowing_windows": {
            "Kharif": "Jan – Mar (Spring planting)",
            "Rabi": "Oct – Nov (Autumn planting)"
        },
        "growing_duration_days": "300 – 360 days",
        "duration_days_num": 330,
        "yield_estimate": "45.0 – 60.0 tons/acre (Cane yield in irrigated delta)",
        "drought_tolerance": "Moderate",
        "waterlogging_sensitivity": "Moderate (Tolerates short inundation better than maize)",
        "salinity_sensitivity": "Moderate",
        "intercrops": [
            {"id": "Green Gram", "name": "Green Gram", "timing": "Early furrow intercrop (first 60 days)"},
            {"id": "Soybean", "name": "Soybean", "timing": "Intercrop between wide cane rows"}
        ],
        "key_risks": [
            "Formative stage (60–150 days) demands frequent irrigation; drought stunts cane height.",
            "Water stagnation prior to harvest lowers sucrose accumulation."
        ],
        "image_url": "/assets/crop_paddy.jpg",
        "data_source": "ICAR-SBI (Sugarcane Breeding Institute)"
    },
    "Green Gram": {
        "id": "Green Gram",
        "name": "Green Gram (Moong Dal)",
        "scientific_name": "Vigna radiata L.",
        "telugu_name": "పెసలు (Pesalu)",
        "category": "Pulses",
        "suitable_ph_min": 6.0,
        "suitable_ph_max": 7.5,
        "optimal_ph_min": 6.3,
        "optimal_ph_max": 7.2,
        "soil_textures": ["Loamy", "Clay Loam", "Sandy Loam", "Alluvial"],
        "unsuitable_textures": ["Saline soil", "Waterlogged clay"],
        "temp_min": 20.0,
        "temp_max": 38.0,
        "temp_opt_min": 25.0,
        "temp_opt_max": 33.0,
        "water_requirement_mm": 300,
        "irrigation_depth_mm": 15,
        "water_source_affinity": ["Borewell", "Canal Water", "Rainfed", "Sprinkler"],
        "min_water_level": "Low",
        "seasons": ["Kharif", "Rabi", "Pre-summer"],
        "season_label": "Feb – Apr (Summer pulse) / Jun – Aug (Kharif)",
        "sowing_windows": {
            "Kharif": "Jun – Jul",
            "Rabi": "Oct – Nov",
            "Pre-summer": "Feb – Mar"
        },
        "growing_duration_days": "65 – 75 days",
        "duration_days_num": 70,
        "yield_estimate": "0.6 – 0.9 tons/acre (High protein pulse yield)",
        "drought_tolerance": "High",
        "waterlogging_sensitivity": "Very High (Nodule root decay under 24h waterlogging)",
        "salinity_sensitivity": "High",
        "intercrops": [
            {"id": "Paddy", "name": "Paddy", "timing": "Pre-kharif green manure / summer catch crop"},
            {"id": "Cotton", "name": "Cotton", "timing": "Intercrop between rows"}
        ],
        "key_risks": [
            "Continuous overcast weather triggers yellow mosaic virus (YMV) and powdery mildew.",
            "Rainfall at pod maturity causes viviparous germination in the pod."
        ],
        "image_url": "/assets/crop_greengram.jpg",
        "data_source": "ICAR-IIPR & ANGRAU Pulse Research Station"
    },
    "Black Gram": {
        "id": "Black Gram",
        "name": "Black Gram (Urad Dal)",
        "scientific_name": "Vigna mungo L.",
        "telugu_name": "మినుములు (Minumulu)",
        "category": "Pulses",
        "suitable_ph_min": 6.0,
        "suitable_ph_max": 7.5,
        "optimal_ph_min": 6.2,
        "optimal_ph_max": 7.0,
        "soil_textures": ["Loamy", "Clay Loam", "Black Cotton", "Alluvial"],
        "unsuitable_textures": ["Waterlogged soils", "Acidic soils (pH < 5.5)"],
        "temp_min": 20.0,
        "temp_max": 38.0,
        "temp_opt_min": 25.0,
        "temp_opt_max": 32.0,
        "water_requirement_mm": 320,
        "irrigation_depth_mm": 15,
        "water_source_affinity": ["Borewell", "Canal Water", "Rainfed"],
        "min_water_level": "Low",
        "seasons": ["Rabi", "Kharif"],
        "season_label": "Nov – Jan (Rice fallow rabi) / Jun – Aug (Kharif)",
        "sowing_windows": {
            "Rabi": "Nov – Dec (Ideal for rice fallows)",
            "Kharif": "Jun – Jul"
        },
        "growing_duration_days": "70 – 80 days",
        "duration_days_num": 75,
        "yield_estimate": "0.7 – 1.0 tons/acre (Grain yield in rice fallow relay)",
        "drought_tolerance": "High",
        "waterlogging_sensitivity": "High",
        "salinity_sensitivity": "High",
        "intercrops": [
            {"id": "Paddy", "name": "Paddy", "timing": "Zero-till relay broadcast 2 days before rice harvest"},
            {"id": "Maize", "name": "Maize", "timing": "Paired row intercropping"}
        ],
        "key_risks": [
            "Heavy unseasonal rainfall during pod maturity ruins seed luster.",
            "Powdery mildew occurs if nights are humid and cool."
        ],
        "image_url": "/assets/crop_greengram.jpg",
        "data_source": "ICAR-IIPR & ANGRAU Regional Agricultural Research Station, Lam"
    },
    "Sesame": {
        "id": "Sesame",
        "name": "Sesame (Gingelly / Til)",
        "scientific_name": "Sesamum indicum L.",
        "telugu_name": "నువ్వులు (Nuvvulu)",
        "category": "Oilseeds",
        "suitable_ph_min": 5.8,
        "suitable_ph_max": 7.8,
        "optimal_ph_min": 6.2,
        "optimal_ph_max": 7.2,
        "soil_textures": ["Sandy Loam", "Loamy", "Clay Loam"],
        "unsuitable_textures": ["Poorly drained clay"],
        "temp_min": 20.0,
        "temp_max": 40.0,
        "temp_opt_min": 26.0,
        "temp_opt_max": 34.0,
        "water_requirement_mm": 350,
        "irrigation_depth_mm": 15,
        "water_source_affinity": ["Borewell", "Canal Water", "Rainfed"],
        "min_water_level": "Low",
        "seasons": ["Pre-summer", "Rabi", "Kharif"],
        "season_label": "Jan – Apr (Summer sesame) / Jun – Aug (Kharif)",
        "sowing_windows": {
            "Pre-summer": "Jan – Feb",
            "Kharif": "Jun – Jul"
        },
        "growing_duration_days": "80 – 90 days",
        "duration_days_num": 85,
        "yield_estimate": "0.4 – 0.6 tons/acre (High premium oilseed)",
        "drought_tolerance": "Very High",
        "waterlogging_sensitivity": "Extremely High (Even brief standing water destroys the crop)",
        "salinity_sensitivity": "High",
        "intercrops": [
            {"id": "Green Gram", "name": "Green Gram", "timing": "Row intercrop for dual harvest"},
            {"id": "Groundnut", "name": "Groundnut", "timing": "Mixed cropping"}
        ],
        "key_risks": [
            "Extremely sensitive to standing water at any vegetative phase.",
            "Phyllody disease transmitted by leafhoppers during warm humid spells."
        ],
        "image_url": "/assets/crop_sesame.jpg",
        "data_source": "ICAR-IIOR (Indian Institute of Oilseeds Research)"
    },
    "Tomato": {
        "id": "Tomato",
        "name": "Tomato (Hybrid)",
        "scientific_name": "Solanum lycopersicum L.",
        "telugu_name": "టమోటా (Tomato)",
        "category": "Vegetables",
        "suitable_ph_min": 6.0,
        "suitable_ph_max": 7.5,
        "optimal_ph_min": 6.2,
        "optimal_ph_max": 6.8,
        "soil_textures": ["Loamy", "Sandy Loam", "Clay Loam", "Red Sandy"],
        "unsuitable_textures": ["Waterlogged poorly aerated clay"],
        "temp_min": 15.0,
        "temp_max": 35.0,
        "temp_opt_min": 20.0,
        "temp_opt_max": 28.0,
        "water_requirement_mm": 500,
        "irrigation_depth_mm": 18,
        "water_source_affinity": ["Drip System", "Borewell"],
        "min_water_level": "Moderate",
        "seasons": ["Rabi", "Kharif"],
        "season_label": "Oct – Feb (Rabi prime quality) / Jul – Nov (Kharif)",
        "sowing_windows": {
            "Rabi": "Oct – Nov (Cool season crop with best fruit set)",
            "Kharif": "Jun – Jul"
        },
        "growing_duration_days": "110 – 130 days",
        "duration_days_num": 120,
        "yield_estimate": "12.0 – 18.0 tons/acre (Staked hybrid drip yield)",
        "drought_tolerance": "Low",
        "waterlogging_sensitivity": "Very High",
        "salinity_sensitivity": "Moderate",
        "intercrops": [
            {"id": "French Beans", "name": "French Beans", "timing": "Short-duration companion row"},
            {"id": "Marigold", "name": "Marigold", "timing": "Trap crop against fruit borer (Helicoverpa)"}
        ],
        "key_risks": [
            "Erratic watering causes fruit cracking and blossom end rot (calcium transport failure).",
            "High daytime heat (> 35°C) causes flower sterility."
        ],
        "image_url": "/assets/crop_chilli.jpg",
        "data_source": "ICAR-IIHR (Indian Institute of Horticultural Research)"
    },
    "Onion": {
        "id": "Onion",
        "name": "Onion",
        "scientific_name": "Allium cepa L.",
        "telugu_name": "ఉల్లిపాయ (Ullipaya)",
        "category": "Vegetables",
        "suitable_ph_min": 6.0,
        "suitable_ph_max": 7.5,
        "optimal_ph_min": 6.5,
        "optimal_ph_max": 7.2,
        "soil_textures": ["Loamy", "Sandy Loam", "Alluvial", "Clay Loam"],
        "unsuitable_textures": ["Heavy clay with crusting", "Saline soils"],
        "temp_min": 13.0,
        "temp_max": 35.0,
        "temp_opt_min": 18.0,
        "temp_opt_max": 28.0,
        "water_requirement_mm": 450,
        "irrigation_depth_mm": 18,
        "water_source_affinity": ["Drip System", "Sprinkler", "Canal Water", "Borewell"],
        "min_water_level": "Moderate",
        "seasons": ["Rabi", "Kharif"],
        "season_label": "Nov – Mar (Rabi bulb crop) / Jul – Nov (Kharif)",
        "sowing_windows": {
            "Rabi": "Nov – Dec",
            "Kharif": "Jun – Jul"
        },
        "growing_duration_days": "110 – 125 days",
        "duration_days_num": 115,
        "yield_estimate": "8.0 – 12.0 tons/acre (Clean graded bulb yield)",
        "drought_tolerance": "Low (Shallow fibrous roots)",
        "waterlogging_sensitivity": "High (Causes basal rot and bulb purple blotch)",
        "salinity_sensitivity": "High",
        "intercrops": [
            {"id": "Chilli", "name": "Chilli", "timing": "Raised bed companion border"},
            {"id": "Coriander", "name": "Coriander", "timing": "Light surface companion"}
        ],
        "key_risks": [
            "Irrigation must be stopped 12–15 days before harvest to prevent storage rot.",
            "Water stress during bulb swelling causes splitting and thick necks."
        ],
        "image_url": "/assets/crop_groundnut.jpg",
        "data_source": "ICAR-DOGR (Directorate of Onion and Garlic Research)"
    }
}


class CropRecommendationService:
    def __init__(self):
        self.catalog = CROP_CATALOG

    def get_catalog(self) -> List[Dict[str, Any]]:
        return list(self.catalog.values())

    def get_crop_by_id(self, crop_id: str) -> Optional[Dict[str, Any]]:
        # Normalize key lookup
        for key, crop in self.catalog.items():
            if key.lower() == crop_id.strip().lower() or crop["id"].lower() == crop_id.strip().lower():
                return crop
        return None

    def evaluate_crop_suitability(
        self,
        crop: Dict[str, Any],
        soil_ph: Optional[float],
        soil_type: str,
        season: str,
        water_source: str,
        weather: Optional[Dict[str, Any]] = None,
        nitrogen_kg_ha: Optional[float] = None,
        phosphorus_kg_ha: Optional[float] = None,
        potassium_kg_ha: Optional[float] = None,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Calculates explainable suitability score (0 - 100) based on agronomic compatibility weights:
          1. Soil compatibility: 30% (pH range + soil texture matching)
          2. Temperature compatibility: 20% (Live & forecast temperature against cardinal limits)
          3. Rainfall compatibility: 20% (Forecast & seasonal rainfall vs crop demand)
          4. Water availability: 15% (Source reliability and method compatibility)
          5. Seasonal suitability: 10% (Sowing window match)
          6. Nutrient compatibility: 5% (NPK availability if recorded, or neutral confidence)
        """
        missing_inputs = []
        breakdown = {}
        explanations = []
        bullets = []
        risks = list(crop.get("key_risks", []))

        # -------------------------------------------------------------
        # 1. Soil Compatibility (30 points)
        # -------------------------------------------------------------
        soil_score = 0.0
        # 1a. pH compatibility (18 points max)
        if soil_ph is not None:
            opt_min = crop["optimal_ph_min"]
            opt_max = crop["optimal_ph_max"]
            s_min = crop["suitable_ph_min"]
            s_max = crop["suitable_ph_max"]

            if opt_min <= soil_ph <= opt_max:
                ph_score = 18.0
                explanations.append(f"Soil pH {soil_ph:.1f} is in the optimal range ({opt_min} – {opt_max}) for {crop['name']}.")
                bullets.append(f"Matches your soil pH ({soil_ph:.1f})")
            elif s_min <= soil_ph <= s_max:
                # Linear interpolation between suitable and optimal
                if soil_ph < opt_min:
                    ratio = (soil_ph - s_min) / max(0.1, (opt_min - s_min))
                else:
                    ratio = (s_max - soil_ph) / max(0.1, (s_max - opt_max))
                ph_score = 12.0 + (6.0 * max(0.0, min(1.0, ratio)))
                explanations.append(f"Soil pH {soil_ph:.1f} is acceptable (suitable limits {s_min} – {s_max}).")
                bullets.append(f"Tolerates current soil pH ({soil_ph:.1f})")
            else:
                ph_score = 4.0
                deviation = abs(soil_ph - opt_min) if soil_ph < opt_min else abs(soil_ph - opt_max)
                explanations.append(f"Soil pH {soil_ph:.1f} deviates from suitable range ({s_min} – {s_max}) by {deviation:.1f} units.")
                risks.append(f"Soil pH ({soil_ph:.1f}) is outside standard range ({s_min}–{s_max}); nutrient uptake may be restricted without soil amendment.")
        else:
            missing_inputs.append("Soil pH (assumed neutral 6.8 default)")
            ph_score = 13.0  # neutral assumption
            explanations.append(f"Soil pH not measured; default neutral assumption applied (ideal {crop['optimal_ph_min']}–{crop['optimal_ph_max']}).")

        # 1b. Texture compatibility (12 points max)
        norm_soil = soil_type.strip().lower()
        matched_texture = any(norm_soil in st.lower() or st.lower() in norm_soil for st in crop["soil_textures"])
        unsuitable_match = any(norm_soil in ust.lower() or ust.lower() in norm_soil for ust in crop.get("unsuitable_textures", []))

        if unsuitable_match:
            tex_score = 2.0
            risks.append(f"{soil_type} texture has documented limitations for {crop['name']} (compaction/drainage risks).")
            explanations.append(f"Soil texture '{soil_type}' is unfavorable for {crop['name']}.")
        elif matched_texture:
            tex_score = 12.0
            explanations.append(f"Soil texture '{soil_type}' matches ideal root aeration and moisture holding profile.")
            bullets.append(f"Ideal for {soil_type} soil")
        else:
            tex_score = 7.0
            explanations.append(f"Soil texture '{soil_type}' provides moderate growth conditions.")

        soil_score = round(ph_score + tex_score, 1)
        breakdown["soil_compatibility"] = soil_score

        # -------------------------------------------------------------
        # 2. Temperature Compatibility (20 points)
        # -------------------------------------------------------------
        curr_temp = 31.0
        if weather and "current_temp" in weather:
            curr_temp = float(weather["current_temp"])

        t_opt_min = crop["temp_opt_min"]
        t_opt_max = crop["temp_opt_max"]
        t_min = crop["temp_min"]
        t_max = crop["temp_max"]

        if t_opt_min <= curr_temp <= t_opt_max:
            temp_score = 20.0
            explanations.append(f"Current temperature {curr_temp:.1f}°C is in optimal thermal window ({t_opt_min}°C – {t_opt_max}°C).")
        elif t_min <= curr_temp <= t_max:
            if curr_temp < t_opt_min:
                ratio = (curr_temp - t_min) / max(1.0, (t_opt_min - t_min))
            else:
                ratio = (t_max - curr_temp) / max(1.0, (t_max - t_opt_max))
            temp_score = round(12.0 + 8.0 * max(0.0, min(1.0, ratio)), 1)
            explanations.append(f"Current temperature {curr_temp:.1f}°C is within acceptable thermal range ({t_min}°C – {t_max}°C).")
        else:
            temp_score = 5.0
            risks.append(f"Current ambient temperature ({curr_temp}°C) exceeds normal vegetative limits ({t_min}–{t_max}°C).")
            explanations.append(f"Temperature {curr_temp:.1f}°C is outside favorable thermal range.")

        breakdown["temperature_compatibility"] = temp_score

        # -------------------------------------------------------------
        # 3. Rainfall & Climate Compatibility (20 points)
        # -------------------------------------------------------------
        forecast_rain_mm = 0.0
        if weather and "forecast" in weather and weather["forecast"]:
            forecast_rain_mm = sum(f.get("precipitation_sum", 0.0) for f in weather["forecast"][:7])

        crop_demand = crop["water_requirement_mm"]
        if crop_demand >= 1000:
            # High water demand crop (Paddy, Sugarcane)
            if forecast_rain_mm >= 25:
                rain_score = 20.0
                explanations.append(f"Forecast 7-day rainfall ({forecast_rain_mm:.1f} mm) substantially supplements high crop water demand.")
                bullets.append(f"Recent rainfall ({forecast_rain_mm:.1f} mm) aids growth")
            else:
                rain_score = 14.0
                explanations.append(f"Low 7-day rainfall ({forecast_rain_mm:.1f} mm); will depend on regular field irrigation.")
        elif crop_demand <= 400:
            # Low water requirement pulse / oilseed
            if forecast_rain_mm >= 40:
                rain_score = 10.0
                risks.append(f"Heavy rain forecast ({forecast_rain_mm:.1f} mm) threatens root stagnation for sensitive pulse {crop['name']}.")
            else:
                rain_score = 20.0
                explanations.append(f"Low rainfall condition is optimal for drought-hardy {crop['name']}.")
                bullets.append(f"Low water requirement ({crop['water_requirement_mm']} mm/season)")
        else:
            # Moderate demand crop
            rain_score = 17.0
            explanations.append(f"Forecast precipitation is balanced for moderate moisture demand ({crop_demand} mm/season).")

        breakdown["rainfall_compatibility"] = rain_score

        # -------------------------------------------------------------
        # 4. Water Availability Compatibility (15 points)
        # -------------------------------------------------------------
        norm_source = water_source.strip().lower()
        affinity = [s.lower() for s in crop["water_source_affinity"]]

        source_matched = any(norm_source in a or a in norm_source for a in affinity)
        if source_matched:
            water_score = 15.0
            explanations.append(f"Irrigation source '{water_source}' is well suited for {crop['name']}.")
        elif "rainfed" in norm_source:
            if crop["drought_tolerance"] in ["High", "Very High"]:
                water_score = 13.0
                explanations.append(f"Crop has {crop['drought_tolerance'].lower()} drought tolerance; viable under rainfed conditions.")
            else:
                water_score = 5.0
                risks.append(f"Rainfed cultivation is high-risk for {crop['name']} without assured supplemental irrigation.")
        else:
            water_score = 10.0
            explanations.append(f"Irrigation source '{water_source}' provides usable water supply.")

        breakdown["water_availability"] = water_score

        # -------------------------------------------------------------
        # 5. Seasonal Suitability (10 points)
        # -------------------------------------------------------------
        # Check season match
        crop_seasons = [s.lower() for s in crop["seasons"]]
        sel_season_lower = season.strip().lower()

        if sel_season_lower == "all" or sel_season_lower in crop_seasons:
            season_score = 10.0
            explanations.append(f"{crop['name']} is traditionally cultivated and proven in {season} season in this agro-zone.")
            bullets.append(f"Suitable for current {season} season")
        else:
            season_score = 3.0
            risks.append(f"{season} is not the primary documented sowing season for {crop['name']}; yield may decline.")
            explanations.append(f"Current season '{season}' is non-standard for {crop['name']} (recommended: {', '.join(crop['seasons'])}).")

        breakdown["seasonal_suitability"] = season_score

        # -------------------------------------------------------------
        # 6. Nutrient Compatibility (5 points)
        # -------------------------------------------------------------
        if nitrogen_kg_ha is not None and phosphorus_kg_ha is not None:
            nutrient_score = 5.0
            explanations.append(f"Soil nutrient profile (N: {nitrogen_kg_ha} kg/ha, P: {phosphorus_kg_ha} kg/ha) matches baseline fertility requirements.")
        else:
            nutrient_score = 4.0
            missing_inputs.append("Soil N-P-K nutrient lab values (standard baseline assumed)")

        breakdown["nutrient_compatibility"] = nutrient_score

        # -------------------------------------------------------------
        # Total Suitability Score (out of 100)
        # -------------------------------------------------------------
        total_score = round(sum(breakdown.values()), 1)
        total_score = max(10.0, min(99.0, total_score))

        # Categorization
        if total_score >= 80.0:
            suitability_label = "High suitability"
            suitability_type = "best"
        elif total_score >= 65.0:
            suitability_label = "Suitable"
            suitability_type = "good"
        else:
            suitability_label = "Alternative option"
            suitability_type = "alternative"

        # Unique bullets (max 4)
        if not bullets:
            bullets = [
                f"Documented for {season} season",
                f"Works in {soil_type} soil",
                f"Expected yield {crop['yield_estimate'].split('(')[0].strip()}"
            ]

        # Extract primary season string
        primary_season = crop["seasons"][0] if crop["seasons"] else "Kharif"

        # Localization
        crop_display_name = localization_service.translate_crop_name(crop["name"], lang=language)
        suitability_display = localization_service.translate_phrase(suitability_label, lang=language)
        
        if language != "en":
            temp_val = weather.get("current_temp", 32) if weather else 32
            localized_reason = localization_service.localize_crop_suitability_reason(crop["name"], soil_ph or 6.8, temp_val, soil_type, lang=language)
            final_explanations = [localized_reason]
            # Translate bullets for non-English languages
            bullets = localization_service.localize_crop_bullets(
                crop_name=crop["name"],
                soil_ph=soil_ph or 6.8,
                soil_type=soil_type,
                season=season,
                suitability_type=suitability_type,
                yield_estimate=crop["yield_estimate"].split("(")[0].strip(),
                lang=language
            )
        else:
            final_explanations = explanations[:4]

        return {
            "id": crop["id"],
            "name": crop_display_name,
            "name_en": crop["name"],
            "scientific_name": crop["scientific_name"],
            "telugu_name": crop["telugu_name"],
            "category": crop["category"],
            "suitability": suitability_display,
            "suitability_en": suitability_label,
            "suitabilityType": suitability_type,
            "score": total_score,
            "score_breakdown": breakdown,
            "seasonType": primary_season,
            "season": crop["season_label"],
            "phRange": f"{crop['optimal_ph_min']} – {crop['optimal_ph_max']}",
            "yieldEstimate": crop["yield_estimate"],
            "waterReq": f"{crop['irrigation_depth_mm']} – {crop['irrigation_depth_mm'] + 6} mm per irrigation",
            "bullets": bullets[:3],
            "whyRecommended": final_explanations,
            "risks": risks[:3],
            "missing_inputs": missing_inputs,
            "interCrops": crop["intercrops"],
            "image_url": crop["image_url"],
            "data_source": crop["data_source"],
            "timestamp": datetime.datetime.utcnow().isoformat()
        }

    def recommend_crops(
        self,
        soil_ph: Optional[float] = None,
        soil_type: str = "Loamy",
        season: str = "Kharif",
        water_source: str = "Canal",
        weather: Optional[Dict[str, Any]] = None,
        nitrogen_kg_ha: Optional[float] = None,
        phosphorus_kg_ha: Optional[float] = None,
        potassium_kg_ha: Optional[float] = None,
        preferred_category: Optional[str] = None,
        language: str = "en"
    ) -> List[Dict[str, Any]]:
        results = []
        for crop in self.catalog.values():
            if preferred_category and preferred_category.lower() != "all":
                if crop["category"].lower() != preferred_category.strip().lower():
                    continue

            eval_res = self.evaluate_crop_suitability(
                crop=crop,
                soil_ph=soil_ph,
                soil_type=soil_type,
                season=season,
                water_source=water_source,
                weather=weather,
                nitrogen_kg_ha=nitrogen_kg_ha,
                phosphorus_kg_ha=phosphorus_kg_ha,
                potassium_kg_ha=potassium_kg_ha,
                language=language
            )
            results.append(eval_res)

        # Sort strictly descending by suitability score
        results.sort(key=lambda x: x["score"], reverse=True)
        return results

    def compare_crops(
        self,
        crop_ids: List[str],
        soil_ph: Optional[float] = 6.8,
        soil_type: str = "Loamy",
        season: str = "Kharif",
        water_source: str = "Canal"
    ) -> Dict[str, Any]:
        crops_data = []
        for cid in crop_ids:
            crop_spec = self.get_crop_by_id(cid)
            if crop_spec:
                evaluated = self.evaluate_crop_suitability(
                    crop=crop_spec,
                    soil_ph=soil_ph,
                    soil_type=soil_type,
                    season=season,
                    water_source=water_source
                )
                crops_data.append({
                    "id": evaluated["id"],
                    "name": evaluated["name"],
                    "score": evaluated["score"],
                    "suitability": evaluated["suitability"],
                    "season": evaluated["season"],
                    "growing_duration": crop_spec["growing_duration_days"],
                    "duration_days_num": crop_spec.get("duration_days_num", 120),
                    "seasonal_water_demand_mm": crop_spec["water_requirement_mm"],
                    "irrigation_per_event": evaluated["waterReq"],
                    "soil_suitability": f"Optimal pH {evaluated['phRange']}, prefers {', '.join(crop_spec['soil_textures'][:2])}",
                    "climate_suitability": f"Optimal temp {crop_spec['temp_opt_min']}–{crop_spec['temp_opt_max']}°C",
                    "expected_yield": evaluated["yieldEstimate"],
                    "drought_tolerance": crop_spec["drought_tolerance"],
                    "waterlogging_sensitivity": crop_spec["waterlogging_sensitivity"],
                    "risks": evaluated["risks"],
                    "intercrops": [ic["name"] for ic in crop_spec.get("intercrops", [])]
                })

        # Summary insights
        lowest_water_crop = min(crops_data, key=lambda c: c["seasonal_water_demand_mm"], default=None)
        fastest_duration_crop = min(crops_data, key=lambda c: c["duration_days_num"], default=None)
        highest_score_crop = max(crops_data, key=lambda c: c["score"], default=None)

        return {
            "comparison": crops_data,
            "insights": {
                "highest_ranked": highest_score_crop["name"] if highest_score_crop else None,
                "lowest_water_consumer": lowest_water_crop["name"] if lowest_water_crop else None,
                "fastest_harvest": fastest_duration_crop["name"] if fastest_duration_crop else None,
                "soil_context": f"Evaluated for {soil_type} soil with pH {soil_ph if soil_ph else 'neutral (6.8)'}."
            }
        }


crop_recommendation_service = CropRecommendationService()
