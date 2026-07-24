// =====================================================================
// ColdChain Monitor — Data Layer
// ---------------------------------------------------------------------
// Vehicles / Drivers / Maintenance now talk to the real backend API
// (see backend/api/server.js). Alerts / Reports / Analytics are still
// mock placeholders — swap them the same way when you wire those up.
// =====================================================================

const API_BASE = "https://coldchain-monitor.onrender.com";

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed (${res.status})`);
  return res.json();
}

async function apiSend(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    let message = `${method} ${path} failed (${res.status})`;
    try {
      const data = await res.json();
      if (data && data.error) message = data.error;
    } catch (_) { /* body wasn't JSON, keep the generic message */ }
    throw new Error(message);
  }
  return res.status === 204 ? null : res.json();
}

// ---------------------------------------------------------------------
// VEHICLES — live (GET/POST/DELETE /api/vehicles)
// ---------------------------------------------------------------------
async function getVehicles() {
  return apiGet("/api/vehicles");
}

async function addVehicle({ plate, route, driverId, deviceId }) {
  return apiSend("POST", "/api/vehicles", {
    plate, route, driverId: driverId || null, deviceId: deviceId || null
  });
}

async function deleteVehicle(id) {
  return apiSend("DELETE", `/api/vehicles/${id}`);
}

// ---------------------------------------------------------------------
// DRIVERS — live (GET/POST/DELETE /api/drivers)
// ---------------------------------------------------------------------
async function getDrivers() {
  return apiGet("/api/drivers");
}

async function addDriver({ name, phone, license, status, vehicleId }) {
  return apiSend("POST", "/api/drivers", {
    name, phone, license, status, vehicleId: vehicleId || null
  });
}

async function deleteDriver(id) {
  return apiSend("DELETE", `/api/drivers/${id}`);
}

// ---------------------------------------------------------------------
// MAINTENANCE — live (GET/POST/DELETE /api/maintenance)
// ---------------------------------------------------------------------
async function getMaintenanceLogs() {
  return apiGet("/api/maintenance");
}

async function addMaintenance({ vehicleId, task, dueDate, status }) {
  return apiSend("POST", "/api/maintenance", { vehicleId, task, dueDate, status });
}

async function deleteMaintenance(id) {
  return apiSend("DELETE", `/api/maintenance/${id}`);
}

// ---------------------------------------------------------------------
// ALERTS — mirrors SQL table `alerts` (still mock — dashboard.js and
// dashboard.html already fetch the real /api/alerts directly)
// ---------------------------------------------------------------------
const MOCK_ALERTS = [
  { time: "10:24 AM", vehicle: "RJ14 AB 4587", type: "Temperature High", message: "Temperature reached 31.2°C", severity: "High",   status: "Active"   },
  { time: "09:56 AM", vehicle: "DL1L AB 1234", type: "Humidity High",    message: "Humidity reached 72%",       severity: "Medium", status: "Active"   },
  { time: "08:40 AM", vehicle: "RJ14 AB 4587", type: "Temperature Low",  message: "Temperature dropped to 2.1°C",severity: "High",   status: "Resolved" },
  { time: "07:15 AM", vehicle: "DL1L AB 1234", type: "Sensor Offline",   message: "Sensor not responding",       severity: "High",   status: "Resolved" },
  { time: "06:30 AM", vehicle: "RJ14 AB 4587", type: "Door Open",        message: "Door was opened for 2 min",   severity: "Low",    status: "Resolved" }
];

async function getAlerts() {
  // 🔌 INTEGRATION POINT: return apiGet("/api/alerts") to go live here too.
  return Promise.resolve(MOCK_ALERTS);
}

// ---------------------------------------------------------------------
// DAILY REPORT — still mock
// ---------------------------------------------------------------------
const MOCK_REPORT_ROWS = [
  { vehicle: "RJ14 AB 4587", avgTemp: 22.3, avgHumidity: 54, minTemp: 18.2, maxTemp: 27.5, totalAlerts: 6,  status: "Healthy" },
  { vehicle: "DL1L AB 1234", avgTemp: 24.6, avgHumidity: 60, minTemp: 20.1, maxTemp: 31.8, totalAlerts: 10, status: "Warning" }
];

async function getReportRows(reportType, vehicleFilter) {
  // 🔌 INTEGRATION POINT: return apiGet(`/api/reports?...`) to go live here too.
  return Promise.resolve(MOCK_REPORT_ROWS);
}

// ---------------------------------------------------------------------
// ANALYTICS SUMMARY — still mock
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

async function getAnalyticsSummary() {
  // 🔌 INTEGRATION POINT: return apiGet("/api/analytics/summary") to go live here too.
  return Promise.resolve(MOCK_ANALYTICS_SUMMARY);
}
