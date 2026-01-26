-- Enable UUID extension for PostgreSQL
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create storage_units table
CREATE TABLE storage_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "locationId" UUID NOT NULL,
    "minTemperature" NUMERIC NOT NULL,
    "maxTemperature" NUMERIC NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT storage_temp_check CHECK ("minTemperature" <= "maxTemperature")
);

-- Index for location queries (frequently used for filtering by location)
CREATE INDEX idx_storage_units_location ON storage_units("locationId");

-- Index for capacity queries
CREATE INDEX idx_storage_units_capacity ON storage_units(capacity);

-- Index for temperature range queries
CREATE INDEX idx_storage_units_temp_range ON storage_units("minTemperature", "maxTemperature");
