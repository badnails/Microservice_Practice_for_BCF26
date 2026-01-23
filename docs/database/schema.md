# Database Schema

## locations

| Column | Type | Constraints |
|------|------|------------|
| id | UUID | Primary Key |
| name | TEXT | NOT NULL |
| type | location_type | NOT NULL |
| city | TEXT | NOT NULL |

---

## products

| Column | Type | Constraints |
|------|------|------------|
| id | UUID | Primary Key |
| name | TEXT | NOT NULL |
| minTemperature | NUMERIC | NOT NULL |
| maxTemperature | NUMERIC | NOT NULL |

Constraint: `minTemperature <= maxTemperature`

---

## storage_units

| Column | Type | Constraints |
|------|------|------------|
| id | UUID | Primary Key |
| locationId | UUID | Foreign Key → locations(id), ON DELETE CASCADE |
| minTemperature | NUMERIC | NOT NULL |
| maxTemperature | NUMERIC | NOT NULL |
| capacity | INT | NOT NULL, > 0 |

Constraint: `minTemperature <= maxTemperature`

---

## routes

| Column | Type | Constraints |
|------|------|------------|
| id | UUID | Primary Key |
| fromLocationId | UUID | Foreign Key → locations(id), ON DELETE CASCADE |
| toLocationId | UUID | Foreign Key → locations(id), ON DELETE CASCADE |
| capacity | INT | NOT NULL, ≥ 0 |
| minShipment | INT | NOT NULL, ≥ 0 |

Constraint: `fromLocationId != toLocationId`

---

## demands

| Column | Type | Constraints |
|------|------|------------|
| id | UUID | Primary Key |
| locationId | UUID | Foreign Key → locations(id), ON DELETE CASCADE |
| productId | UUID | Foreign Key → products(id), ON DELETE CASCADE |
| date | DATE | NOT NULL |
| minQuantity | INT | NOT NULL, ≥ 0 |
| maxQuantity | INT | NOT NULL, ≥ minQuantity |
