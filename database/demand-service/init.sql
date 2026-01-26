-- Enable UUID extension for PostgreSQL
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create demands table
CREATE TABLE demands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "locationId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    date DATE NOT NULL,
    "minQuantity" INT NOT NULL CHECK ("minQuantity" >= 0),
    "maxQuantity" INT NOT NULL CHECK ("maxQuantity" >= 0),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT quantity_check CHECK ("maxQuantity" >= "minQuantity")
);

-- Indexes for demand queries
CREATE INDEX idx_demands_date ON demands(date);
CREATE INDEX idx_demands_location ON demands("locationId");
CREATE INDEX idx_demands_product ON demands("productId");

-- Composite index for date + location queries (common use case)
CREATE INDEX idx_demands_date_location ON demands(date, "locationId");

-- Composite index for date + product queries
CREATE INDEX idx_demands_date_product ON demands(date, "productId");
