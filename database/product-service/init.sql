-- Enable UUID extension for PostgreSQL
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    "minTemperature" NUMERIC NOT NULL,
    "maxTemperature" NUMERIC NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT temp_range_check CHECK ("minTemperature" <= "maxTemperature")
);

-- Index for product name searches
CREATE INDEX idx_products_name ON products(name);

-- Index for temperature range queries
CREATE INDEX idx_products_temp_range ON products("minTemperature", "maxTemperature");
