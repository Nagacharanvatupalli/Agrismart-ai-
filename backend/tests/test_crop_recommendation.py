import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.database import Base, engine
from app.services.crop_recommendation_service import (
    crop_recommendation_service,
    CROP_CATALOG
)

client = TestClient(app)

def setup_module(module):
    Base.metadata.create_all(bind=engine)

def test_crop_catalog_retrieval():
    """Verify crop catalog returns documented ICAR/ANGRAU crop records with scientific details."""
    response = client.get("/api/crops/catalog")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 10
    
    # Check that Paddy has authoritative parameters
    paddy = next((c for c in data if c["id"].lower() == "paddy"), None)
    assert paddy is not None
    assert "Oryza sativa" in paddy["scientific_name"]
    assert paddy["water_requirement_mm"] >= 900
    assert "Clay" in paddy["soil_textures"] or "Clay Loam" in paddy["soil_textures"]

def test_single_crop_details():
    """Verify retrieving detailed agronomic profile for a specific crop."""
    response = client.get("/api/crops/catalog/cotton")
    assert response.status_code == 200
    data = response.json()
    assert "cotton" in data["name"].lower()
    assert "Gossypium" in data["scientific_name"]
    assert any("cotton" in t.lower() or "clay" in t.lower() for t in data["soil_textures"])
    assert any("kharif" in s.lower() for s in data["seasons"])

def test_crop_recommendation_ranking():
    """Verify recommendation engine dynamically ranks crops with explainable 6-factor scoring."""
    payload = {
        "farm_id": 1,
        "village": "Bhimavaram",
        "district": "West Godavari",
        "latitude": 16.5449,
        "longitude": 81.5212,
        "area": 2.5,
        "season": "Kharif",
        "soil_ph": 6.8,
        "soil_type": "Clay Loam",
        "water_source": "Canal"
    }
    response = client.post("/api/crops/recommend", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "recommendations" in data
    assert len(data["recommendations"]) > 0

    top_crop = data["recommendations"][0]
    assert "score" in top_crop
    assert 0 <= top_crop["score"] <= 100
    # explanation is called 'whyRecommended' in the response
    assert "whyRecommended" in top_crop or "explanation" in top_crop
    assert "score_breakdown" in top_crop
    breakdown = top_crop["score_breakdown"]
    assert any(k in breakdown for k in ["soil_compatibility", "soil"])
    assert any(k in breakdown for k in ["water_availability", "water"])

def test_soil_ph_impacts_recommendations():
    """Verify changing soil pH significantly alters suitability scores and rankings."""
    base_payload = {
        "farm_id": 1,
        "village": "Bhimavaram",
        "district": "West Godavari",
        "latitude": 16.5449,
        "longitude": 81.5212,
        "area": 2.5,
        "season": "Kharif",
        "soil_type": "Clay Loam",
        "water_source": "Canal"
    }

    # Optimal pH for Paddy and general crops (6.8)
    res_optimal = client.post("/api/crops/recommend", json={**base_payload, "soil_ph": 6.8})
    recs_optimal = {c["id"]: c["score"] for c in res_optimal.json()["recommendations"]}

    # Strongly alkaline pH (8.8) where Cotton and Paddy handle better than delicate legumes
    res_alkaline = client.post("/api/crops/recommend", json={**base_payload, "soil_ph": 8.8})
    recs_alkaline = {c["id"]: c["score"] for c in res_alkaline.json()["recommendations"]}

    # Suitability scores must adjust deterministically based on agronomic thresholds
    assert recs_optimal["Paddy"] != recs_alkaline["Paddy"]
    assert recs_optimal["Paddy"] > recs_alkaline["Paddy"]

def test_water_availability_sensitivity():
    """Verify changing water availability (Canal vs Rainfed) penalizes high water crops."""
    payload_canal = {
        "village": "Tanuku",
        "district": "West Godavari",
        "latitude": 16.75,
        "longitude": 81.68,
        "area": 2.0,
        "season": "Kharif",
        "soil_ph": 6.5,
        "soil_type": "Clay Loam",
        "water_source": "Canal"
    }
    payload_rainfed = {**payload_canal, "water_source": "Rainfed"}

    res_canal = client.post("/api/crops/recommend", json=payload_canal).json()["recommendations"]
    res_rainfed = client.post("/api/crops/recommend", json=payload_rainfed).json()["recommendations"]

    paddy_canal = next(c for c in res_canal if "paddy" in c["name"].lower())
    paddy_rainfed = next(c for c in res_rainfed if "paddy" in c["name"].lower())

    # High water crop like Paddy must have higher water score with Canal than Rainfed
    assert paddy_canal["score_breakdown"]["water_availability"] > paddy_rainfed["score_breakdown"]["water_availability"]

def test_crop_comparison():
    """Verify side-by-side comparison for selected crops."""
    comp_payload = {
        "crop_ids": ["Paddy", "Maize", "Groundnut"],
        "soil_ph": 6.5,
        "soil_type": "Clay Loam",
        "water_source": "Canal",
        "area": 2.0
    }
    response = client.post("/api/crops/compare", json=comp_payload)
    assert response.status_code == 200
    data = response.json()
    assert "comparison" in data
    assert len(data["comparison"]) == 3
    assert "insights" in data

    crop_compare = data["comparison"][0]
    assert "seasonal_water_demand_mm" in crop_compare
    assert "growing_duration" in crop_compare
    assert "soil_suitability" in crop_compare
