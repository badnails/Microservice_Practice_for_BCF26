-- Enable UUID extension for PostgreSQL
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom ENUM for Location Types
CREATE TYPE location_type AS ENUM ('PRODUCER', 'WAREHOUSE', 'RETAILER', 'HOSPITAL');

-- Create locations table
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type location_type NOT NULL,
    city TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for type queries (performance optimization)
CREATE INDEX idx_locations_type ON locations(type);

-- Index for city queries
CREATE INDEX idx_locations_city ON locations(city);

-- Index for name searches
CREATE INDEX idx_locations_name ON locations(name);
