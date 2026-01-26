-- Enable UUID extension for PostgreSQL
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create routes table
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "fromLocationId" UUID NOT NULL,
    "toLocationId" UUID NOT NULL,
    capacity INT NOT NULL CHECK (capacity >= 0),
    "minShipment" INT NOT NULL CHECK ("minShipment" >= 0),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT route_logic_check CHECK ("fromLocationId" <> "toLocationId")
);

-- Indexes for route queries (frequently used for pathfinding)
CREATE INDEX idx_routes_from ON routes("fromLocationId");
CREATE INDEX idx_routes_to ON routes("toLocationId");

-- Composite index for from-to queries
CREATE INDEX idx_routes_from_to ON routes("fromLocationId", "toLocationId");

-- Index for capacity queries
CREATE INDEX idx_routes_capacity ON routes(capacity);
