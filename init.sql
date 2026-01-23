-- Enable UUID extension for PostgreSQL
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom ENUM for Location Types
CREATE TYPE location_type AS ENUM ('PRODUCER', 'WAREHOUSE', 'RETAILER', 'HOSPITAL');

-- 1. Locations
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type location_type NOT NULL,
    city TEXT NOT NULL
);

-- 2. Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    "minTemperature" NUMERIC NOT NULL,
    "maxTemperature" NUMERIC NOT NULL,
    CONSTRAINT temp_range_check CHECK ("minTemperature" <= "maxTemperature")
);

-- 3. Storage Units
CREATE TABLE storage_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "locationId" UUID REFERENCES locations(id) ON DELETE CASCADE,
    "minTemperature" NUMERIC NOT NULL,
    "maxTemperature" NUMERIC NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    CONSTRAINT storage_temp_check CHECK ("minTemperature" <= "maxTemperature")
);

-- 4. Routes
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "fromLocationId" UUID REFERENCES locations(id) ON DELETE CASCADE,
    "toLocationId" UUID REFERENCES locations(id) ON DELETE CASCADE,
    capacity INT NOT NULL CHECK (capacity >= 0),
    "minShipment" INT NOT NULL CHECK ("minShipment" >= 0),
    CONSTRAINT route_logic_check CHECK ("fromLocationId" <> "toLocationId")
);

-- 5. Demands
CREATE TABLE demands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "locationId" UUID REFERENCES locations(id) ON DELETE CASCADE,
    "productId" UUID REFERENCES products(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    "minQuantity" INT NOT NULL CHECK ("minQuantity" >= 0),
    "maxQuantity" INT NOT NULL CHECK ("maxQuantity" >= "minQuantity")
);