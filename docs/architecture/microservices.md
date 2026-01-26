# Microservices Architecture Design

## Overview

This document outlines the microservices architecture for the Logistics Network API. The current monolithic application is decomposed into logical, independently deployable services based on domain-driven design principles.

---

## Architecture Diagram

```
                                    ┌─────────────────────┐
                                    │    API Gateway      │
                                    │   (Request Router)  │
                                    └──────────┬──────────┘
                                               │
           ┌───────────────┬───────────────┬───┴───┬───────────────┬───────────────┐
           │               │               │       │               │               │
           ▼               ▼               ▼       ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌───────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │  Location   │ │   Product   │ │ Warehouse │ │   Routing   │ │   Demand    │ │ Validation  │
    │   Service   │ │   Service   │ │  Service  │ │   Service   │ │   Service   │ │   Service   │
    └──────┬──────┘ └──────┬──────┘ └─────┬─────┘ └──────┬──────┘ └──────┬──────┘ └─────────────┘
           │               │              │              │               │               │
           ▼               ▼              ▼              ▼               ▼               │
    ┌─────────────┐ ┌─────────────┐ ┌───────────┐ ┌─────────────┐ ┌─────────────┐        │
    │  locations  │ │  products   │ │  storage  │ │   routes    │ │   demands   │        │
    │     DB      │ │     DB      │ │  units DB │ │     DB      │ │     DB      │        │
    └─────────────┘ └─────────────┘ └───────────┘ └─────────────┘ └─────────────┘        │
                                                                                         │
                           ◄──────────────── Queries via Service APIs ───────────────────┘


---

## Microservices List

| # | Service Name       | Port | Database         |
|---|--------------------|------|------------------|
| 1 | Location Service   | 3001 | locations_db     |
| 2 | Product Service    | 3002 | products_db      |
| 3 | Warehouse Service. | 3003 | warehouse_db     |
| 4 | Routing Service    | 3004 | routing_db       |
| 5 | Demand Service     | 3005 | demands_db       |
| 6 | Validation Service | 3006 | None (stateless) |
| 7 | API Gateway | 3000 | None |

---

## Service Descriptions

### 1. Location Service

**Responsibility**: Manages all location entities in the logistics network including producers, warehouses, retailers, and hospitals.

**Domain**: Core master data for network nodes

**Capabilities**:
- Create, read, update, delete locations
- Query locations by type (PRODUCER, WAREHOUSE, RETAILER, HOSPITAL)
- Validate location existence for other services

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/locations` | Create a new location |
| GET | `/locations` | List all locations |
| GET | `/locations/:id` | Get location by ID |
| GET | `/locations?type=WAREHOUSE` | Filter locations by type |
| DELETE | `/locations/:id` | Delete a location |

#### Database Schema

```sql
CREATE TYPE location_type AS ENUM ('PRODUCER', 'WAREHOUSE', 'RETAILER', 'HOSPITAL');

CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type location_type NOT NULL,
    city TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### 2. Product Service

**Responsibility**: Manages the product catalog including temperature-sensitive product requirements.

**Domain**: Product master data and temperature specifications

**Capabilities**:
- Create, read, update, delete products
- Manage temperature requirements for cold chain logistics
- Validate product existence for other services

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/products` | Create a new product |
| GET | `/products` | List all products |
| GET | `/products/:id` | Get product by ID |
| DELETE | `/products/:id` | Delete a product |

#### Database Schema

```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    "minTemperature" NUMERIC NOT NULL,
    "maxTemperature" NUMERIC NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT temp_range_check CHECK ("minTemperature" <= "maxTemperature")
);
```

---

### 3. Warehouse Service

**Responsibility**: Manages storage units within warehouse locations, including temperature-controlled storage and capacity management.

**Domain**: Warehouse operations and storage capacity

**Capabilities**:
- Create, read, update, delete storage units
- Validate storage unit creation against warehouse locations (via Location Service)
- Manage temperature ranges and capacity for storage units
- Track storage utilization

**Dependencies**: Location Service (to validate WAREHOUSE type)

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/storage-units` | Create a new storage unit |
| GET | `/storage-units` | List all storage units |
| GET | `/storage-units/:id` | Get storage unit by ID |
| GET | `/storage-units?locationId=:id` | Get storage units by location |
| DELETE | `/storage-units/:id` | Delete a storage unit |

#### Database Schema

```sql
CREATE TABLE storage_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "locationId" UUID NOT NULL,  -- References Location Service
    "minTemperature" NUMERIC NOT NULL,
    "maxTemperature" NUMERIC NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT storage_temp_check CHECK ("minTemperature" <= "maxTemperature")
);

-- Index for location queries
CREATE INDEX idx_storage_units_location ON storage_units("locationId");
```

---

### 4. Routing Service

**Responsibility**: Manages transportation routes between locations with capacity and minimum shipment constraints.

**Domain**: Transportation network and route optimization

**Capabilities**:
- Create, read, update, delete routes
- Validate route endpoints against locations (via Location Service)
- Manage route capacity and minimum shipment requirements
- Query routes by source/destination

**Dependencies**: Location Service (to validate location existence)

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/routes` | Create a new route |
| GET | `/routes` | List all routes |
| GET | `/routes/:id` | Get route by ID |
| GET | `/routes?from=:id` | Get routes from a location |
| GET | `/routes?to=:id` | Get routes to a location |
| DELETE | `/routes/:id` | Delete a route |

#### Database Schema

```sql
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "fromLocationId" UUID NOT NULL,  -- References Location Service
    "toLocationId" UUID NOT NULL,    -- References Location Service
    capacity INT NOT NULL CHECK (capacity >= 0),
    "minShipment" INT NOT NULL CHECK ("minShipment" >= 0),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT route_logic_check CHECK ("fromLocationId" <> "toLocationId")
);

-- Indexes for route queries
CREATE INDEX idx_routes_from ON routes("fromLocationId");
CREATE INDEX idx_routes_to ON routes("toLocationId");
```

---

### 5. Demand Service

**Responsibility**: Manages product demand at locations for specific dates, including quantity constraints.

**Domain**: Demand forecasting and order management

**Capabilities**:
- Create, read, update, delete demands
- Validate demands against locations and products (via respective services)
- Query demands by date, location, or product
- Support demand forecasting queries

**Dependencies**: 
- Location Service (to validate location existence)
- Product Service (to validate product existence)

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/demands` | Create a new demand |
| GET | `/demands` | List all demands |
| GET | `/demands/:id` | Get demand by ID |
| GET | `/demands?date=:date` | Get demands for a specific date |
| GET | `/demands?locationId=:id` | Get demands for a location |
| DELETE | `/demands/:id` | Delete a demand |

#### Database Schema

```sql
CREATE TABLE demands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "locationId" UUID NOT NULL,  -- References Location Service
    "productId" UUID NOT NULL,   -- References Product Service
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
```

---

### 6. Validation Service

**Responsibility**: Provides cross-cutting validation logic for temperature compatibility and network feasibility analysis.

**Domain**: Business rule validation and network analysis

**Capabilities**:
- Validate temperature compatibility between products and storage units
- Validate network feasibility (capacity constraints)
- Detect MAX_CAPACITY_VIOLATION and MIN_CAPACITY_VIOLATION
- Aggregate data from multiple services for validation

**Dependencies** (Read-only):
- Location Service
- Product Service
- Warehouse Service
- Routing Service
- Demand Service

**Note**: This is a **stateless service** that queries other services to perform validations.

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/temps/validate` | Validate temperature compatibility for a date |
| POST | `/network/validate` | Validate network feasibility for a date |

#### Request/Response

**Temperature Validation**
```json
// Request
{ "date": "2026-01-25" }

// Response
{ 
  "valid": true 
}
// or
{
  "valid": false,
  "issues": ["Product X temperature range incompatible with storage units"]
}
```

**Network Validation**
```json
// Request
{ "date": "2026-01-25" }

// Response
{ 
  "feasible": true 
}
// or
{
  "feasible": false,
  "issues": ["MAX_CAPACITY_VIOLATION", "MIN_CAPACITY_VIOLATION"]
}
```

---

### 7. API Gateway

**Responsibility**: Single entry point for all client requests, handles routing, authentication, rate limiting, and request aggregation.

**Capabilities**:
- Route requests to appropriate microservices
- Aggregate responses for network summary
- Handle CORS
- Rate limiting and throttling
- Authentication/Authorization (future)
- Request logging and monitoring

#### API Endpoints (Aggregated)

| Method | Endpoint | Routed To |
|--------|----------|-----------|
| POST/GET | `/locations` | Location Service |
| POST/GET | `/products` | Product Service |
| POST/GET | `/storage-units` | Warehouse Service |
| POST/GET | `/routes` | Routing Service |
| POST/GET | `/demands` | Demand Service |
| POST | `/temps/validate` | Validation Service |
| POST | `/network/validate` | Validation Service |
| GET | `/network/summary` | **Aggregates from all services** |

---

## API to Microservice Mapping

| Original API | HTTP Method | Microservice | Notes |
|--------------|-------------|--------------|-------|
| `/locations` | POST | Location Service | Direct routing |
| `/locations` | GET | Location Service | Direct routing |
| `/products` | POST | Product Service | Direct routing |
| `/products` | GET | Product Service | Direct routing |
| `/storage-units` | POST | Warehouse Service | Validates location via Location Service |
| `/storage-units` | GET | Warehouse Service | Direct routing |
| `/routes` | POST | Routing Service | Validates locations via Location Service |
| `/routes` | GET | Routing Service | Direct routing |
| `/demands` | POST | Demand Service | Validates via Location & Product Services |
| `/demands` | GET | Demand Service | Direct routing |
| `/network/summary` | GET | API Gateway | Aggregates from all 5 data services |
| `/temps/validate` | POST | Validation Service | Queries multiple services |
| `/network/validate` | POST | Validation Service | Queries multiple services |

---

## Database Schema to Microservice Mapping

| Database Table  | Microservice      | Ownership      |
|-----------------|-------------------|----------------|
| `locations`     | Location Service  | Full ownership |
| `products`      | Product Service   | Full ownership |
| `storage_units` | Warehouse Service | Full ownership |
| `routes`        | Routing Service   | Full ownership |
| `demands`       | Demand Service    | Full ownership |

### Data Ownership Principles

1. **Single Source of Truth**: Each table is owned by exactly one microservice
2. **No Shared Databases**: Each service has its own database instance
3. **API-Based Access**: Services access other services' data only via APIs
4. **Eventual Consistency**: Accept that data may be eventually consistent across services

---

## Inter-Service Communication

### Synchronous (HTTP/REST)

| Calling Service | Called Service | Purpose |
|-----------------|----------------|---------|
| Warehouse Service | Location Service | Validate WAREHOUSE type on storage unit creation |
| Routing Service | Location Service | Validate location existence on route creation |
| Demand Service | Location Service | Validate location existence on demand creation |
| Demand Service | Product Service | Validate product existence on demand creation |
| Validation Service | All Data Services | Gather data for validation logic |
| API Gateway | All Services | Request routing and aggregation |

### Asynchronous (Event-Driven) - Future Enhancement

| Event | Publisher | Subscribers |
|-------|-----------|-------------|
| `location.deleted` | Location Service | Warehouse, Routing, Demand Services |
| `product.deleted` | Product Service | Demand Service |
| `demand.created` | Demand Service | Validation Service (for alerts) |

---

## Scalability Considerations

### Horizontal Scaling

| Service | Scaling Strategy | Rationale |
|---------|------------------|-----------|
| Location Service | Low scale | Master data, infrequent updates |
| Product Service | Low scale | Master data, infrequent updates |
| Warehouse Service | Medium scale | Storage operations increase with network growth |
| Routing Service | Medium scale | Route queries for path optimization |
| Demand Service | High scale | High write volume for demand forecasting |
| Validation Service | High scale | CPU-intensive validation logic |
| API Gateway | High scale | All traffic passes through |

### Database Scaling

- **Location/Product**: Single replica with read replicas
- **Warehouse/Routing**: Sharding by region if needed
- **Demands**: Time-series partitioning by date

---

## Technology Recommendations

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Runtime | Bun | Existing expertise, performance |
| API Framework | Hono/ElysiaJS | Lightweight, Bun-optimized |
| Database | PostgreSQL | Existing schema, ACID compliance |
| Service Discovery | Consul / Kubernetes DNS | Dynamic service registration |
| API Gateway | Kong / Traefik | Production-grade routing |
| Message Queue | RabbitMQ / Redis Streams | Event-driven communication |
| Monitoring | Prometheus + Grafana | Metrics and dashboards |
| Tracing | Jaeger / Zipkin | Distributed tracing |

---

## Migration Strategy

### Phase 1: Strangler Fig Pattern
1. Deploy API Gateway in front of monolith
2. Extract Location Service first (no dependencies)
3. Extract Product Service (no dependencies)

### Phase 2: Core Services
4. Extract Warehouse Service (depends on Location)
5. Extract Routing Service (depends on Location)
6. Extract Demand Service (depends on Location + Product)

### Phase 3: Cross-Cutting Services
7. Extract Validation Service
8. Decommission monolith

---

## Summary

This microservices architecture provides:

- **Loose Coupling**: Services communicate via well-defined APIs
- **High Cohesion**: Each service owns a single domain
- **Independent Deployment**: Services can be deployed independently
- **Scalability**: Services can scale based on individual load
- **Maintainability**: Smaller codebases are easier to understand and modify
- **Technology Flexibility**: Services can use different technologies if needed
