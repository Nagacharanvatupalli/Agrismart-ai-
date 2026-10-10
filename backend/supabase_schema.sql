-- ==============================================================================
-- AgriSmart AI — Supabase Database Migration & Seed Script
-- Compatible with: Supabase PostgreSQL (SQL Editor)
-- ==============================================================================

-- 1. Enable Useful Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. Clean Existing Tables (Optional: Uncomment if resetting schema)
-- ==============================================================================
-- DROP TABLE IF EXISTS crops CASCADE;
-- DROP TABLE IF EXISTS ai_conversations CASCADE;
-- DROP TABLE IF EXISTS saved_items CASCADE;
-- DROP TABLE IF EXISTS weather_alerts CASCADE;
-- DROP TABLE IF EXISTS farm_soil_records CASCADE;
-- DROP TABLE IF EXISTS farms CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ==============================================================================
-- 3. Table: users
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    verified BOOLEAN DEFAULT TRUE,
    preferred_language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 4. Table: farms
-- ==============================================================================
CREATE TABLE IF NOT EXISTS farms (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    farm_name VARCHAR(255) NOT NULL,
    acreage DOUBLE PRECISION NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    village VARCHAR(255) NOT NULL,
    mandal VARCHAR(255),
    district VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL DEFAULT 'Andhra Pradesh',
    survey_number VARCHAR(100),
    
    -- Soil & Agronomy Details
    soil_ph DOUBLE PRECISION,
    soil_ph_updated_at TIMESTAMP WITH TIME ZONE,
    soil_type VARCHAR(100) DEFAULT 'Loamy',
    water_availability VARCHAR(100) DEFAULT 'Moderate',
    recent_rainfall VARCHAR(255) DEFAULT '42 mm (last 30 days)',
    current_season VARCHAR(100) DEFAULT 'Kharif (Jun - Sep)',
    previous_crops VARCHAR(255) DEFAULT 'Paddy, Maize',
    recent_fertilizers VARCHAR(255) DEFAULT 'Urea, DAP',
    irrigation_method VARCHAR(100) DEFAULT 'Drip / Canal',
    current_crops VARCHAR(255) DEFAULT 'Paddy',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 5. Table: crops (My Crops Feature)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS crops (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    farm_id INTEGER NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    area DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    area_unit VARCHAR(50) DEFAULT 'acres',
    growth_stage VARCHAR(100) DEFAULT 'Vegetative Stage',
    status VARCHAR(50) DEFAULT 'Healthy',      -- Healthy, Good, Attention, Critical
    category VARCHAR(50) DEFAULT 'active',     -- active, harvested
    soil_ph DOUBLE PRECISION,
    land_type VARCHAR(100) DEFAULT 'Loamy',
    water_source VARCHAR(100) DEFAULT 'Canal Water',
    planting_date VARCHAR(100),
    expected_harvest_date VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 5.1 Table: crop_logs (Field Operations, AI Scans & History)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS crop_logs (
    id SERIAL PRIMARY KEY,
    crop_id INTEGER NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
    log_date VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,            -- planting, fertilizer, irrigation, observation, vision_scan
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'completed',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 6. Table: farm_soil_records
-- ==============================================================================
CREATE TABLE IF NOT EXISTS farm_soil_records (
    id SERIAL PRIMARY KEY,
    farm_id INTEGER NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    ph DOUBLE PRECISION NOT NULL,
    measurement_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    measurement_source VARCHAR(255) DEFAULT 'Soil Testing Lab',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 7. Table: weather_alerts
-- ==============================================================================
CREATE TABLE IF NOT EXISTS weather_alerts (
    id SERIAL PRIMARY KEY,
    farm_id INTEGER NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    risk_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,             -- high, medium, low
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    metric VARCHAR(100),
    forecast_window VARCHAR(100),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 8. Table: saved_items
-- ==============================================================================
CREATE TABLE IF NOT EXISTS saved_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    farm_id INTEGER REFERENCES farms(id) ON DELETE SET NULL,
    item_type VARCHAR(100) NOT NULL,           -- ai_answer, soil_guidance, crop_recommendation, weather_report
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    metadata_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 9. Table: ai_conversations
-- ==============================================================================
CREATE TABLE IF NOT EXISTS ai_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    farm_id INTEGER REFERENCES farms(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    audio_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 9.1 Table: crop_details_cache (1-Hour Detection Caching)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS crop_details_cache (
    id SERIAL PRIMARY KEY,
    crop_id INTEGER NOT NULL UNIQUE REFERENCES crops(id) ON DELETE CASCADE,
    details_json TEXT NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 10. Performance Indexes
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_farms_user_id ON farms(user_id);
CREATE INDEX IF NOT EXISTS idx_crops_user_id ON crops(user_id);
CREATE INDEX IF NOT EXISTS idx_crops_farm_id ON crops(farm_id);
CREATE INDEX IF NOT EXISTS idx_crops_category ON crops(category);
CREATE INDEX IF NOT EXISTS idx_soil_records_farm_id ON farm_soil_records(farm_id);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_farm_id ON weather_alerts(farm_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_user_id ON saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_crop_details_cache_crop_id ON crop_details_cache(crop_id);
CREATE INDEX IF NOT EXISTS idx_crop_logs_crop_id ON crop_logs(crop_id);
CREATE INDEX IF NOT EXISTS idx_crop_logs_category ON crop_logs(category);

-- ==============================================================================
-- 11. Initial Demo Seed Data
-- ==============================================================================
-- 11.1 Default Farmer Profile
INSERT INTO users (id, name, phone, verified, preferred_language)
VALUES (1, 'Ramesh Kumar', '+919876543210', TRUE, 'en')
ON CONFLICT (id) DO NOTHING;

-- 11.2 Default Farm Parcels
INSERT INTO farms (id, user_id, farm_name, acreage, latitude, longitude, pincode, village, mandal, district, state, soil_ph, soil_type, water_availability)
VALUES 
  (1, 1, 'Bhimavaram Farm', 2.50, 16.5449, 81.5212, '534201', 'Bhimavaram', 'Bhimavaram', 'West Godavari', 'Andhra Pradesh', 6.5, 'Clay Loam', 'Canal Water'),
  (2, 1, 'Tanuku Farm', 1.75, 16.7588, 81.6961, '534211', 'Tanuku', 'Tanuku', 'West Godavari', 'Andhra Pradesh', 6.8, 'Loamy', 'Borewell'),
  (3, 1, 'Narsapuram Farm', 3.00, 16.4389, 81.6883, '534275', 'Narsapuram', 'Narsapuram', 'West Godavari', 'Andhra Pradesh', 7.1, 'Sandy Loam', 'Canal Water'),
  (4, 1, 'Eluru Farm', 2.00, 16.7107, 81.0952, '534001', 'Eluru', 'Eluru', 'Eluru', 'Andhra Pradesh', 6.7, 'Clay', 'Borewell')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence to avoid ID conflicts
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));
SELECT setval('farms_id_seq', (SELECT COALESCE(MAX(id), 1) FROM farms));

-- 11.3 Default Crops
INSERT INTO crops (id, user_id, farm_id, name, area, area_unit, growth_stage, status, category, soil_ph, land_type, water_source, planting_date, expected_harvest_date)
VALUES
  (1, 1, 1, 'Paddy', 2.50, 'acres', 'Vegetative Stage', 'Healthy', 'active', 6.5, 'Clay Loam', 'Canal Water', '10 Jun 2024', '15 Oct 2024'),
  (2, 1, 2, 'Maize', 1.75, 'acres', 'Grain Filling', 'Attention', 'active', 6.8, 'Loamy', 'Borewell', '01 Jul 2024', '20 Oct 2024'),
  (3, 1, 3, 'Chilli', 3.00, 'acres', 'Flowering', 'Healthy', 'active', 7.1, 'Sandy Loam', 'Canal Water', '15 May 2024', '30 Nov 2024'),
  (4, 1, 1, 'Groundnut', 2.00, 'acres', 'Pod Development', 'Healthy', 'active', 6.5, 'Clay Loam', 'Canal Water', '20 Jun 2024', '10 Oct 2024'),
  (5, 1, 2, 'Cotton', 1.50, 'acres', 'Vegetative Stage', 'Good', 'active', 6.8, 'Black Cotton', 'Borewell', '05 Jun 2024', '15 Jan 2025')
ON CONFLICT (id) DO NOTHING;

SELECT setval('crops_id_seq', (SELECT COALESCE(MAX(id), 1) FROM crops));

-- 11.4 Sample Soil Record
INSERT INTO farm_soil_records (farm_id, ph, measurement_source, notes)
VALUES (1, 6.5, 'Regional Soil Health Center', 'Optimal pH for Paddy kharif season cultivation.');

-- 11.5 Sample Weather Alert
INSERT INTO weather_alerts (farm_id, risk_type, severity, title, message, recommendation, metric, forecast_window)
VALUES (
  1,
  'Heavy Rainfall Alert',
  'high',
  'Heavy Rainfall Expected in West Godavari',
  '45mm precipitation predicted over the next 48 hours.',
  'Postpone nitrogen top-dressing and inspect field drainage channels to prevent waterlogging.',
  '45 mm / 48 hrs',
  'Next 48 Hours'
);

-- ==============================================================================
-- 12. Enable Row Level Security (RLS) & Grant Permissions
-- ==============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_soil_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_details_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_logs ENABLE ROW LEVEL SECURITY;

-- Allow full access for postgres & service role (and authenticated / anon for development)
DROP POLICY IF EXISTS "Allow all operations for anon and service role" ON users;
CREATE POLICY "Allow all operations for anon and service role" ON users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations for anon and service role" ON farms;
CREATE POLICY "Allow all operations for anon and service role" ON farms FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations for anon and service role" ON crops;
CREATE POLICY "Allow all operations for anon and service role" ON crops FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations for anon and service role" ON farm_soil_records;
CREATE POLICY "Allow all operations for anon and service role" ON farm_soil_records FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations for anon and service role" ON weather_alerts;
CREATE POLICY "Allow all operations for anon and service role" ON weather_alerts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations for anon and service role" ON saved_items;
CREATE POLICY "Allow all operations for anon and service role" ON saved_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations for anon and service role" ON ai_conversations;
CREATE POLICY "Allow all operations for anon and service role" ON ai_conversations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations for anon and service role" ON crop_details_cache;
CREATE POLICY "Allow all operations for anon and service role" ON crop_details_cache FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations for anon and service role" ON crop_logs;
CREATE POLICY "Allow all operations for anon and service role" ON crop_logs FOR ALL USING (true) WITH CHECK (true);
