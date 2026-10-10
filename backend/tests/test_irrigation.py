import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.database import Base, engine
from app.services.irrigation_service import (
    irrigation_service,
    calculate_etc,
    estimate_effective_rainfall_usda,
    calculate_volumetric_water,
    calculate_pump_runtime_hours
)

client = TestClient(app)

def setup_module(module):
    Base.metadata.create_all(bind=engine)

def test_explicit_specification_volumetric_case():
    """
    Direct verification of prompt requirement:
    'A field of 2 hectares requires a net irrigation depth of 10 mm.
    Required net water volume: 10 * 2 * 10 = 200 cubic metres.
    At 80% application efficiency: Gross water requirement = 200 / 0.80 = 250 cubic metres.
    Implement this as a unit test.'
    """
    area_ha = 2.0
    net_depth_mm = 10.0
    efficiency = 0.80

    # 1 mm of water over 1 ha = 10 m3
    net_volume_m3 = net_depth_mm * area_ha * 10.0
    assert net_volume_m3 == 200.0, f"Expected 200 m3, got {net_volume_m3}"

    gross_depth_mm = net_depth_mm / efficiency
    assert gross_depth_mm == 12.5

    gross_volume_m3 = net_volume_m3 / efficiency
    assert gross_volume_m3 == 250.0, f"Expected 250 m3, got {gross_volume_m3}"

    # Verify via irrigation service calculation function directly
    calc_res = calculate_volumetric_water(net_depth_mm, area_ha=area_ha, efficiency=efficiency)
    assert calc_res["net_volume_m3"] == 200.0
    assert calc_res["gross_volume_m3"] == 250.0
    assert calc_res["net_liters"] == 200_000
    assert calc_res["gross_liters"] == 250_000

def test_etc_fao56_calculation():
    """Verify ETc = Kc * ETo according to FAO-56."""
    eto = 4.5  # mm/day reference evapotranspiration
    kc = 1.15  # vegetative/mid-season maize or paddy
    etc = calculate_etc(eto, kc)
    assert pytest.approx(etc, 0.01) == 5.175

def test_effective_rainfall_usda():
    """Verify effective rainfall dampening (runoff/deep percolation accounted for)."""
    # Low rain (15 mm) -> mostly retained: (15 * 0.8) - 3.2 = 8.8
    peff_low = estimate_effective_rainfall_usda(15.0)
    assert 0 < peff_low <= 15.0
    assert pytest.approx(peff_low, rel=0.1) == 8.8

    # High rain (100 mm) -> significant runoff losses: (50*0.8-3.2) + (50*0.4) = 36.8+20 = 56.8
    peff_high = estimate_effective_rainfall_usda(100.0)
    assert peff_high < 100.0
    assert pytest.approx(peff_high, rel=0.1) == 56.8

def test_pump_runtime_duration():
    """Verify pump duration formula: Duration (hours) = Gross Volume (m3) / Flow Rate (m3/hr)."""
    gross_volume_m3 = 250.0
    flow_rate_m3_hr = 25.0
    duration_hours = calculate_pump_runtime_hours(gross_volume_m3, flow_rate_m3_hr)
    assert duration_hours == 10.0

def test_smart_irrigation_api_plan():
    """Verify complete API plan generation with FAO-56 metrics and water saving analysis."""
    payload = {
        "farm_id": 1,
        "crop": "Paddy",
        "growth_stage": "Vegetative Stage",
        "water_source": "Canal",
        "area": 2.5,
        "soil_type": "Clay Loam",
        "irrigation_method": "Drip System",
        "pump_flow_rate_m3_hr": 30.0
    }
    response = client.post("/api/irrigation/plan", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Plan contains either top-level or nested fao_calculation keys
    has_net_depth = "net_depth_mm" in data or "net_irrigation_depth_mm" in data or "net_depth_mm" in data.get("fao_calculation", {})
    assert has_net_depth, f"Expected net depth key in response keys: {list(data.keys())}"
    assert "application_efficiency" in data
    assert data["application_efficiency"] == 0.90  # Drip efficiency
    # Accept either naming convention for pump run hours
    assert any(k in data for k in ["pump_runtime_hours", "pump_run_hours", "pump_duration_hours"])
    assert "water_saving" in data
    assert data["water_saving"]["saving_percentage"] > 0
    # Accept either method_comparisons or method_comparison
    assert "method_comparisons" in data or "method_comparison" in data
    methods = data.get("method_comparisons") or data.get("method_comparison")
    assert len(methods) == 3

def test_irrigation_forecast_outlook():
    """Verify 7-day irrigation schedule forecast endpoint."""
    response = client.get("/api/irrigation/forecast/1?crop=Maize&growth_stage=Vegetative Stage")
    assert response.status_code == 200
    data = response.json()
    assert "daily_outlook" in data
    assert len(data["daily_outlook"]) == 7
    first_day = data["daily_outlook"][0]
    assert "day" in first_day
    assert "etc_mm" in first_day
    assert "irrigation_needed" in first_day

def test_irrigation_event_record_and_history():
    """Verify farmer can record actual applied irrigation events and retrieve history."""
    record_payload = {
        "farm_id": 1,
        "irrigation_date": "2026-10-10",
        "depth_applied_mm": 25.0,
        "volume_m3": 150.0,
        "duration_hours": 3.0,
        "irrigation_method": "Drip System",
        "crop": "Paddy",
        "notes": "Morning fertigation cycle completed successfully."
    }
    record_res = client.post("/api/irrigation/record", json=record_payload)
    assert record_res.status_code == 200
    rec_data = record_res.json()
    assert rec_data["status"] == "recorded"
    assert rec_data["depth_applied_mm"] == 25.0

    # Retrieve history
    hist_res = client.get("/api/irrigation/history/1")
    assert hist_res.status_code == 200
    hist_data = hist_res.json()
    # Accept either 'records' or 'recorded_events' key
    events = hist_data.get("records") or hist_data.get("recorded_events", [])
    assert len(events) >= 1

def test_sensor_endpoint_status_honest_representation():
    """Verify IoT status does NOT fabricate fake readings when no device is connected."""
    status_res = client.get("/api/irrigation/sensors/999")
    assert status_res.status_code == 200
    data = status_res.json()
    # Must report honestly when unconfigured
    assert data["connected"] is False
    assert "Sensor not connected" in data["message"]
