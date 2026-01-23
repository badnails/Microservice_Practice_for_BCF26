# Logistics Network

### Seed APIs for Functional Testing

*Notes*

- UUIDs are symbolic for understanding.
- You can auto-generate UUIDs.
- Read the short notes above the API calls for clarity.

### Server Port: 8000 in localhost

---

## Create Locations

### Producers

*POST* http://localhost:8000/locations

{
  "name": "Farm Alpha",
  "type": "PRODUCER",
  "city": "Bogura"
}

Assume UUID → *P1*

---

*POST* http://localhost:8000/locations

{
  "name": "Vaccine Factory Beta",
  "type": "PRODUCER",
  "city": "Gazipur"
}

Assume UUID → *P2*

---

### Warehouses

*POST* http://localhost:8000/locations

{
  "name": "Central Cold Warehouse",
  "type": "WAREHOUSE",
  "city": "Dhaka"
}

Assume UUID → *W1*

---

*POST* http://localhost:8000/locations

{
  "name": "North Storage Hub",
  "type": "WAREHOUSE",
  "city": "Rajshahi"
}

Assume UUID → *W2*

---

*POST* http://localhost:8000/locations

{
  "name": "South Distribution Hub",
  "type": "WAREHOUSE",
  "city": "Khulna"
}

Assume UUID → *W3*

---

### Retailers

*POST* http://localhost:8000/locations

{
  "name": "FreshMart Uttara",
  "type": "RETAILER",
  "city": "Dhaka"
}

Assume UUID → *R1*

---

*POST* http://localhost:8000/locations

{
  "name": "FreshMart Dhanmondi",
  "type": "RETAILER",
  "city": "Dhaka"
}

Assume UUID → *R2*

---

*POST* http://localhost:8000/locations

{
  "name": "FreshMart Khulna",
  "type": "RETAILER",
  "city": "Khulna"
}

Assume UUID → *R3*

---

### Hospital

*POST* http://localhost:8000/locations

{
  "name": "City General Hospital",
  "type": "HOSPITAL",
  "city": "Dhaka"
}

Assume UUID → *H1*

---

## Create Products

*POST* http://localhost:8000/products

{
  "name": "Frozen Vaccine",
  "minTemperature": -20,
  "maxTemperature": -10
}

Assume UUID → *PR1*

---

*POST* http://localhost:8000/products

{
  "name": "Fresh Milk",
  "minTemperature": 2,
  "maxTemperature": 6
}

Assume UUID → *PR2*

---

*POST* http://localhost:8000/products

{
  "name": "Ice Cream",
  "minTemperature": -18,
  "maxTemperature": -5
}

Assume UUID → *PR3*

---

*POST* http://localhost:8000/products

{
  "name": "Frozen Meat",
  "minTemperature": -20,
  "maxTemperature": -5
}

Assume UUID → *PR4*

---

## Create Storage Units

### Central Cold Warehouse (W1)

*POST* http://localhost:8000/storage-units

{
  "locationId": "W1",
  "minTemperature": -25,
  "maxTemperature": -5,
  "capacity": 500
}

---

*POST* http://localhost:8000/storage-units

{
  "locationId": "W1",
  "minTemperature": 0,
  "maxTemperature": 10,
  "capacity": 300
}

---

### North Storage Hub (W2)

*POST* http://localhost:8000/storage-units

{
  "locationId": "W2",
  "minTemperature": -22,
  "maxTemperature": -6,
  "capacity": 250
}

---

*POST* http://localhost:8000/storage-units

{
  "locationId": "W2",
  "minTemperature": 1,
  "maxTemperature": 8,
  "capacity": 200
}

---

### South Distribution Hub (W3)

*POST* http://localhost:8000/storage-units

{
  "locationId": "W3",
  "minTemperature": 1,
  "maxTemperature": 8,
  "capacity": 250
}

---

## Create Routes

### Producer → Warehouse

Note: Farm Alpha ships to Central Cold Warehouse.

*POST* http://localhost:8000/routes

{
  "fromLocationId": "P1",
  "toLocationId": "W1",
  "capacity": 300,
  "minShipment": 50
}

Assume UUID → *RT1*

---

Note: Vaccine Factory Beta ships to North Storage Hub.

*POST* http://localhost:8000/routes

{
  "fromLocationId": "P2",
  "toLocationId": "W2",
  "capacity": 220,
  "minShipment": 40
}

Assume UUID → *RT2*

---

Note: Farm Alpha ships to South Distribution Hub.

*POST* http://localhost:8000/routes

{
  "fromLocationId": "P1",
  "toLocationId": "W3",
  "capacity": 180,
  "minShipment": 30
}

Assume UUID → *RT3*

---

### Warehouse → Retailer

Note: Central Cold Warehouse supplies FreshMart Uttara.

*POST* http://localhost:8000/routes

{
  "fromLocationId": "W1",
  "toLocationId": "R1",
  "capacity": 250,
  "minShipment": 40
}

Assume UUID → *RT4*

---

Note: Central Cold Warehouse supplies FreshMart Dhanmondi.

*POST* http://localhost:8000/routes

{
  "fromLocationId": "W1",
  "toLocationId": "R2",
  "capacity": 150,
  "minShipment": 20
}

Assume UUID → *RT5*

---

Note: North Storage Hub supplies FreshMart Dhanmondi.

*POST* http://localhost:8000/routes

{
  "fromLocationId": "W2",
  "toLocationId": "R2",
  "capacity": 120,
  "minShipment": 10
}

Assume UUID → *RT6*

---

### Warehouse → Hospital

Note: North Storage Hub supplies City General Hospital.

*POST* http://localhost:8000/routes

{
  "fromLocationId": "W2",
  "toLocationId": "H1",
  "capacity": 80,
  "minShipment": 25
}

Assume UUID → *RT7*

---

Note: South Distribution Hub supplies City General Hospital.

*POST* http://localhost:8000/routes

{
  "fromLocationId": "W3",
  "toLocationId": "H1",
  "capacity": 60,
  "minShipment": 15
}

Assume UUID → *RT8*

---

Note: South Distribution Hub supplies FreshMart Khulna.

*POST* http://localhost:8000/routes

{
  "fromLocationId": "W3",
  "toLocationId": "R3",
  "capacity": 120,
  "minShipment": 30
}

Assume UUID → *RT9*

---

## Create Demands

### Date: 2026-01-14 — Temperature compatible

Note: FreshMart Uttara requests Fresh Milk.

*POST* http://localhost:8000/demands

{
  "locationId": "R1",
  "productId": "PR2",
  "date": "2026-01-14",
  "minQuantity": 60,
  "maxQuantity": 120
}

Note: City General Hospital requests Frozen Vaccine.

*POST* http://localhost:8000/demands

{
  "locationId": "H1",
  "productId": "PR1",
  "date": "2026-01-14",
  "minQuantity": 40,
  "maxQuantity": 50
}

---

### Date: 2026-01-15 — Temperature incompatible

Note: FreshMart Dhanmondi requests Ice Cream.

*POST* http://localhost:8000/demands

{
  "locationId": "R2",
  "productId": "PR3",
  "date": "2026-01-15",
  "minQuantity": 40,
  "maxQuantity": 80
}

Note: FreshMart Khulna requests Frozen Meat.

*POST* http://localhost:8000/demands

{
  "locationId": "R3",
  "productId": "PR4",
  "date": "2026-01-15",
  "minQuantity": 30,
  "maxQuantity": 60
}

*Explanation:* Frozen Vaccine cannot be stored at South Distribution Hub (W3), and R3 can only be supplied from W3.

---

### Date: 2026-01-16 — Network feasible

Note: FreshMart Uttara requests Fresh Milk.

*POST* http://localhost:8000/demands

{
  "locationId": "R1",
  "productId": "PR2",
  "date": "2026-01-16",
  "minQuantity": 70,
  "maxQuantity": 100
}

Note: FreshMart Dhanmondi requests Ice Cream.

*POST* http://localhost:8000/demands

{
  "locationId": "R2",
  "productId": "PR3",
  "date": "2026-01-16",
  "minQuantity": 50,
  "maxQuantity": 90
}

Note: City General Hospital requests Frozen Vaccine.

*POST* http://localhost:8000/demands

{
  "locationId": "H1",
  "productId": "PR1",
  "date": "2026-01-16",
  "minQuantity": 30,
  "maxQuantity": 50
}

---

### Date: 2026-01-17 — Route MAX capacity violation

Note: FreshMart Uttara requests Fresh Milk

*POST* http://localhost:8000/demands

{
  "locationId": "R1",
  "productId": "PR2",
  "date": "2026-01-17",
  "minQuantity": 420,
  "maxQuantity": 460
}

Note: FreshMart Dhanmondi requests Fresh Milk

*POST* http://localhost:8000/demands

{
  "locationId": "R2",
  "productId": "PR2",
  "date": "2026-01-17",
  "minQuantity": 250,
  "maxQuantity": 340
}

*Explanation:* Combined demands from FreshMart Uttara and FreshMart Dhanmondi exceed total outbound capacity of Central Cold Warehouse (RT4 + RT5).

---

### Date: 2026-01-18 — Storage MAX capacity violation

Note: FreshMart Uttara requests Fresh Milk

*POST* http://localhost:8000/demands

{
  "locationId": "R1",
  "productId": "PR2",
  "date": "2026-01-18",
  "minQuantity": 270,
  "maxQuantity": 320
}

Note: FreshMart Uttara requests Ice Cream

*POST* http://localhost:8000/demands

{
  "locationId": "R1",
  "productId": "PR3",
  "date": "2026-01-18",
  "minQuantity": 350,
  "maxQuantity": 420
}

Note: FreshMart Dhanmondi requests Ice Cream

*POST* http://localhost:8000/demands

{
  "locationId": "R2",
  "productId": "PR3",
  "date": "2026-01-18",
  "minQuantity": 330,
  "maxQuantity": 390
}

Note: FreshMart Dhanmondi requests Fresh Milk

*POST* http://localhost:8000/demands

{
  "locationId": "R2",
  "productId": "PR2",
  "date": "2026-01-18",
  "minQuantity": 420,
  "maxQuantity": 460
}

*Explanation:* Fresh milk and Ice Cream demands exceed total frozen storage capacity across W1 and W2.

---

### Date: 2026-01-19 — Route MIN capacity violation

Note: FreshMart Uttara requests Fresh Milk.

*POST* http://localhost:8000/demands

{
  "locationId": "R1",
  "productId": "PR2",
  "date": "2026-01-19",
  "minQuantity": 70,
  "maxQuantity": 100
}

Note: FreshMart Dhanmondi requests Ice Cream.

*POST* http://localhost:8000/demands

{
  "locationId": "R2",
  "productId": "PR3",
  "date": "2026-01-19",
  "minQuantity": 50,
  "maxQuantity": 90
}

Note: City General Hospital requests Frozen Vaccine

*POST* http://localhost:8000/demands

{
  "locationId": "H1",
  "productId": "PR1",
  "date": "2026-01-19",
  "minQuantity": 5,
  "maxQuantity": 10
}

*Explanation:* Requested quantities are below minimum shipment limits on both RT7 and RT8 to City General Hospital, and the hospital can only be supplied via RT7 and RT8.

---

## Temperature Validation Calls

### Temperature feasible

*POST* http://localhost:8000/temps/validate

{
  "date": "2026-01-14"
}

{
  "valid": true
}

---

### Temperature incompatible

*POST* http://localhost:8000/temps/validate

{
  "date": "2026-01-15"
}

{
  "valid": false
}

*If possible -*

{
  "valid": false,
  "issues": [
    "Product Frozen Meat is temperature incompatible with storage at location South Distribution Hub for FreshMart Khulna"
  ]
}

---

## Network Validation Calls

### Feasible

*POST* http://localhost:8000/network/validate

{
  "date": "2026-01-16"
}

Expected:

{
  "feasible": true
}

---

### Route MAX capacity violation

*POST* http://localhost:8000/network/validate

{
  "date": "2026-01-17"
}

Expected:

{
  "feasible": false,
  "issues": ["MAX_CAPACITY_VIOLATION"]
}

---

### Storage MAX capacity violation

*POST* http://localhost:8000/network/validate

{
  "date": "2026-01-18"
}

Expected:

{
  "feasible": false,
  "issues": ["MAX_CAPACITY_VIOLATION"]
}

---

### Route MIN capacity violation

*POST* http://localhost:8000/network/validate

{
  "date": "2026-01-19"
}

Expected:

{
  "feasible": false,
  "issues": ["MIN_CAPACITY_VIOLATION"]
}

*If possible -*

{
  "feasible": false,
  "issues": ["MIN_CAPACITY_VIOLATION"],
  "min_capacity_violations": [
    {
      "from": "North Storage Hub",
      "to": "City General Hospital",
      "used_capacity": 5,
      "minShipment": 25
    },
    {
      "from": "South Distribution Hub",
      "to": "City General Hospital",
      "used_capacity": 5,
      "minShipment": 15
    }
  ]
}