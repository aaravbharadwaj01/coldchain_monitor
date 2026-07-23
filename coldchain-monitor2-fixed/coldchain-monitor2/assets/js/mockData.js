// =====================================================================
// ColdChain Monitor — Shared Mock Data
// ---------------------------------------------------------------------
// This file currently supplies STATIC placeholder data so the front-end
// can be viewed and demoed without a live backend.
//
// =====================================================================
// 🔌 BACKEND / ESP32 / SQL DATABASE INTEGRATION POINT (READ ME)
// =====================================================================
// In production, this entire file should be replaced by calls to a real
// backend API (Node/Express, PHP, Django, etc.) backed by a SQL database
// (MySQL / PostgreSQL). The ESP32 device on each vehicle reads a
// DHT22/SHT31 temperature+humidity sensor and periodically POSTs the
// reading to the backend, which INSERTs it into the `sensor_readings`
// table. See:
//   backend/database/schema.sql        -> full SQL schema
//   backend/esp32/esp32_coldchain.ino  -> ESP32 firmware that reads the
//                                          sensor and POSTs JSON to the
//                                          backend every N seconds
//   backend/api/server.js              -> example Express API with the
//                                          exact SQL queries needed for
//                                          every endpoint used below
//
// Every function below is written as an `async` function returning a
// Promise, and already shaped like a `fetch()` call, so that swapping
// the mock implementation for a real one only requires uncommenting
// the fetch block and deleting the mock return line — no other file
// in this project needs to change.
// =====================================================================

// ---------------------------------------------------------------------
// VEHICLES — mirrors SQL table `vehicles` (joined with latest row of
// `sensor_readings` for temperature/humidity/status)
// ---------------------------------------------------------------------
const MOCK_VEHICLES = [
  {
    id: 1,
    plate: "RJ14 AB 4587",
    route: "Jaipur — Ajmer",
    driver: "Mohan Singh",
    status: "Online",          // Online | Offline (device connectivity)
    health: "Healthy",         // Healthy | Warning | Critical
    temperature: 22.1,
    humidity: 54,
    lastUpdated: "10:30 AM, 16 May 2025",
    image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: 2,
    plate: "DL1L AB 1234",
    route: "Delhi — Alwar",
    driver: "Rakesh Kumar",
    status: "Online",
    health: "Warning",
    temperature: 26.8,
    humidity: 60,
    lastUpdated: "10:28 AM, 16 May 2025",
    image: "https://images.unsplash.com/photo-1592805723216-27b7dcc65fbd?w=500&auto=format&fit=crop&q=60"
  }
];

// ---------------------------------------------------------------------
// ALERTS — mirrors SQL table `alerts` (FK vehicle_id -> vehicles.id)
// ---------------------------------------------------------------------
const MOCK_ALERTS = [
  { time: "10:24 AM", vehicle: "RJ14 AB 4587", type: "Temperature High", message: "Temperature reached 31.2°C", severity: "High",   status: "Active"   },
  { time: "09:56 AM", vehicle: "DL1L AB 1234", type: "Humidity High",    message: "Humidity reached 72%",       severity: "Medium", status: "Active"   },
  { time: "08:40 AM", vehicle: "RJ14 AB 4587", type: "Temperature Low",  message: "Temperature dropped to 2.1°C",severity: "High",   status: "Resolved" },
  { time: "07:15 AM", vehicle: "DL1L AB 1234", type: "Sensor Offline",   message: "Sensor not responding",       severity: "High",   status: "Resolved" },
  { time: "06:30 AM", vehicle: "RJ14 AB 4587", type: "Door Open",        message: "Door was opened for 2 min",   severity: "Low",    status: "Resolved" }
];

// ---------------------------------------------------------------------
// DAILY REPORT — aggregated SQL query (AVG/MIN/MAX over sensor_readings
// grouped by vehicle_id for the selected date range)
// ---------------------------------------------------------------------
const MOCK_REPORT_ROWS = [
  { vehicle: "RJ14 AB 4587", avgTemp: 22.3, avgHumidity: 54, minTemp: 18.2, maxTemp: 27.5, totalAlerts: 6,  status: "Healthy" },
  { vehicle: "DL1L AB 1234", avgTemp: 24.6, avgHumidity: 60, minTemp: 20.1, maxTemp: 31.8, totalAlerts: 10, status: "Warning" }
];

// ---------------------------------------------------------------------
// ANALYTICS SUMMARY — aggregated SQL query across all vehicles
// ---------------------------------------------------------------------
const MOCK_ANALYTICS_SUMMARY = {
  avgTemp: 22.6,
  avgTempDelta: -1.2,
  avgHumidity: 56,
  avgHumidityDelta: 2,
  totalAlerts: 18,
  totalAlertsDelta: -6,
  uptime: 98.6,
  uptimeDelta: 1.3,
  status: { healthy: 1, warning: 1, critical: 0, offline: 0 }
};

// ---------------------------------------------------------------------
// DRIVERS — mirrors SQL table `drivers`
// ---------------------------------------------------------------------
const MOCK_DRIVERS = [
  { name: "Mohan Singh", phone: "+91 98765 43210", vehicle: "RJ14 AB 4587", license: "RJ-0420190001234", status: "On Duty" },
  { name: "Rakesh Kumar", phone: "+91 91234 56780", vehicle: "DL1L AB 1234", license: "DL-0320180005678", status: "On Duty" }
];

// ---------------------------------------------------------------------
// MAINTENANCE — mirrors SQL table `maintenance_logs`
// ---------------------------------------------------------------------
const MOCK_MAINTENANCE = [
  { vehicle: "RJ14 AB 4587", task: "Sensor Calibration", dueDate: "20 May 2025", status: "Upcoming" },
  { vehicle: "DL1L AB 1234", task: "Refrigeration Unit Service", dueDate: "18 May 2025", status: "Due Soon" }
];

// =====================================================================
// Data-access functions (swap the mock body for the fetch() call when
// the backend API in backend/api/server.js is deployed)
// =====================================================================

async function getVehicles() {
    const response = await fetch("https://coldchain-monitor.onrender.com/api/vehicles");

    if (!response.ok) {
        throw new Error("Failed to load vehicles");
    }

    return await response.json();
}

async function getAlerts() {
  // ------------------------------------------------------------------
  // 🔌 INTEGRATION POINT: replace with —
  // const res = await fetch("/api/alerts");          // GET, reads SQL `alerts` table
  // return await res.json();
  // ------------------------------------------------------------------
  return Promise.resolve(MOCK_ALERTS);
}

async function getReportRows(reportType, vehicleFilter) {
  // ------------------------------------------------------------------
  // 🔌 INTEGRATION POINT: replace with —
  // const params = new URLSearchParams({ type: reportType, vehicle: vehicleFilter });
  // const res = await fetch(`/api/reports?${params}`); // GET, runs AVG/MIN/MAX SQL aggregate query
  // return await res.json();
  // ------------------------------------------------------------------
  return Promise.resolve(MOCK_REPORT_ROWS);
}

async function getAnalyticsSummary() {
  // ------------------------------------------------------------------
  // 🔌 INTEGRATION POINT: replace with —
  // const res = await fetch("/api/analytics/summary"); // GET, aggregate SQL query across all vehicles
  // return await res.json();
  // ------------------------------------------------------------------
  return Promise.resolve(MOCK_ANALYTICS_SUMMARY);
}

async function getDrivers() {
  // ------------------------------------------------------------------
  // 🔌 INTEGRATION POINT: replace with —
  // const res = await fetch("/api/drivers");          // GET, reads SQL `drivers` table
  // return await res.json();
  // ------------------------------------------------------------------
  return Promise.resolve(MOCK_DRIVERS);
}

async function getMaintenanceLogs() {
  // ------------------------------------------------------------------
  // 🔌 INTEGRATION POINT: replace with —
  // const res = await fetch("/api/maintenance");      // GET, reads SQL `maintenance_logs` table
  // return await res.json();
  // ------------------------------------------------------------------
  return Promise.resolve(MOCK_MAINTENANCE);
}

// ---------------------------------------------------------------------
// 🔌 LIVE SENSOR STREAM INTEGRATION POINT
// ---------------------------------------------------------------------
// For a truly "live" dashboard, poll or use WebSockets so new ESP32
// readings appear without a page refresh:
//
// function subscribeToLiveReadings(onReading) {
//   // Option A (simple): poll every 5s
//   // setInterval(async () => {
//   //   const res = await fetch("/api/sensor-data/latest");
//   //   onReading(await res.json());
//   // }, 5000);
//
//   // Option B (recommended): WebSocket pushed by backend the moment
//   // it receives + INSERTs a new reading POSTed by the ESP32
//   // const ws = new WebSocket("wss://your-server/ws/sensor-data");
//   // ws.onmessage = (event) => onReading(JSON.parse(event.data));
// }
// ---------------------------------------------------------------------
