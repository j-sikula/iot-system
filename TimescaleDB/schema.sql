-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Table 1: Telemetry (TimescaleDB Hypertable)
CREATE TABLE IF NOT EXISTS ieq_readings (
    time TIMESTAMPTZ NOT NULL,
    device_id TEXT NOT NULL,
    battery_percent REAL,    -- 0x002F Power Source (BatPercentRemaining)
    temperature REAL,        -- 0x0402 Temperature 
    pressure REAL,           -- 0x0403 Pressure 
    relative_humidity REAL,  -- 0x0405 Relative Humidity 
    co REAL,                 -- 0x040C Carbon Monoxide 
    co2 REAL,                -- 0x040D Carbon Dioxide 
    no2 REAL,                -- 0x0413 Nitrogen Dioxide 
    o3 REAL,                 -- 0x0415 Ozone 
    pm25 REAL,               -- 0x042A PM2.5 
    hcho REAL,               -- 0x042B Formaldehyde 
    pm1 REAL,                -- 0x042C PM1 
    pm10 REAL,               -- 0x042D PM10 
    tvoc REAL,               -- 0x042E TVOC
    radon REAL               -- 0x042F Radon 
);



-- Convert to Hypertable (if not already converted)
SELECT create_hypertable('ieq_readings', 'time', if_not_exists => TRUE);

-- Primary lookup index
CREATE INDEX IF NOT EXISTS ix_ieq_device_time ON ieq_readings (device_id, time DESC);

-- Compression setup
ALTER TABLE ieq_readings SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'device_id'
);

-- Enable compression policy (compress chunks older than 7 days)
SELECT add_compression_policy('ieq_readings', INTERVAL '7 days', if_not_exists => TRUE);


-- Table 2: Metadata (Standard PostgreSQL Table)
CREATE TABLE IF NOT EXISTS device_metadata (
    device_id VARCHAR(64) PRIMARY KEY,
    fabric_id BIGINT,
    node_id BIGINT,
    building_name VARCHAR(100),
    room_name VARCHAR(100),
    location_detail VARCHAR(100), -- e.g., "Ceiling", "Wall-mounted"
    gps_lat DOUBLE PRECISION,
    gps_lon DOUBLE PRECISION,
    last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

