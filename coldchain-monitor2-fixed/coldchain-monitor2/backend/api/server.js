/*
 * =====================================================================
 * ColdChain Monitor — Reference Backend API (Node.js + Express + MySQL)
 * ---------------------------------------------------------------------
 * This is a REFERENCE implementation showing exactly which SQL query
 * belongs behind every "🔌 INTEGRATION POINT" comment in the front-end
 * (assets/js/mockData.js, login/login.js, and every page's inline
 * comments). Wire this up to a running MySQL instance loaded with
 * backend/database/schema.sql, then point the front-end fetch() calls
 * at these routes.
 *
 * Install:  npm install express mysql2 bcrypt jsonwebtoken cors
 * Run:      node server.js
 * =====================================================================
 */
require("dotenv").config();
console.log("DB_USER =", process.env.DB_USER);
console.log("DB_PASSWORD =", process.env.DB_PASSWORD);
console.log("DB_NAME =", process.env.DB_NAME);

const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

// ---------------------------------------------------------------------
// MySQL connection pool -> backend/database/schema.sql
// ---------------------------------------------------------------------
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "JFEuxsgKDNWGhdoFSzDJzOkHqYrDGLOn",
  database: process.env.DB_NAME || "coldchain_monitor",
  waitForConnections: true,
  connectionLimit: 10
});

// =====================================================================
// AUTH  (used by login/login.js)
// =====================================================================
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "8h" });
  res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
});

// =====================================================================
// VEHICLES  (used by vehicles/vehicles.html + dashboard)
// =====================================================================
app.get("/api/vehicles", async (req, res) => {
  // Join each vehicle with its most recent sensor_readings row so the
  // front-end can show live temperature/humidity/status per vehicle.
  const [rows] = await pool.query(`
    SELECT v.id, v.plate_number AS plate, v.route, d.name AS driver,
           sr.temperature, sr.humidity, sr.recorded_at AS lastUpdated,
           CASE WHEN sr.recorded_at >= NOW() - INTERVAL 10 MINUTE
                THEN 'Online' ELSE 'Offline' END AS status
    FROM vehicles v
    LEFT JOIN drivers d ON d.id = v.driver_id
    LEFT JOIN sensor_readings sr ON sr.id = (
      SELECT id FROM sensor_readings
      WHERE vehicle_id = v.id ORDER BY recorded_at DESC LIMIT 1
    )
  `);
  res.json(rows);
});

app.post("/api/vehicles", async (req, res) => {
  const { plate, route, driverId, deviceId } = req.body;
  const [result] = await pool.query(
    "INSERT INTO vehicles (plate_number, route, driver_id, device_id) VALUES (?, ?, ?, ?)",
    [plate, route, driverId, deviceId]
  );
  res.status(201).json({ id: result.insertId });
});

app.delete("/api/vehicles/:id", async (req, res) => {
  await pool.query("DELETE FROM vehicles WHERE id = ?", [req.params.id]);
  res.status(204).end();
});

// =====================================================================
// SENSOR DATA  (POSTed by the ESP32 — see backend/esp32/esp32_coldchain.ino)
// =====================================================================
app.post("/api/sensor-data", async (req, res) => {
  try {
    const { device_id, temperature, humidity, door_open } = req.body;

    const [vehicleRows] = await pool.query(
      "SELECT id FROM vehicles WHERE device_id = ?",
      [device_id]
    );

    if (!vehicleRows.length) {
      return res.status(404).json({ error: "Unknown device_id" });
    }

    const vehicleId = vehicleRows[0].id;

    await pool.query(
      "INSERT INTO sensor_readings (vehicle_id, temperature, humidity, door_open) VALUES (?, ?, ?, ?)",
      [vehicleId, temperature, humidity, door_open]
    );

    const [[threshold]] = await pool.query(
      "SELECT * FROM thresholds WHERE vehicle_id = ? OR vehicle_id IS NULL ORDER BY vehicle_id DESC LIMIT 1",
      [vehicleId]
    );

    // keep your existing threshold code here...

    res.status(201).json({ ok: true });

  } catch (err) {
    console.error("API ERROR:", err);
    res.status(500).json({
      error: err.message,
      code: err.code
    });
  }
});
  


async function insertAlert(vehicleId, type, message, severity) {
  await pool.query(
    "INSERT INTO alerts (vehicle_id, alert_type, message, severity, status) VALUES (?, ?, ?, ?, 'Active')",
    [vehicleId, type, message, severity]
  );
}

app.get("/api/latest", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT temperature,
                   humidity,
                   door_open,
                   recorded_at
            FROM sensor_readings
            ORDER BY recorded_at DESC
            LIMIT 1
        `);

        if (rows.length === 0) {
            return res.status(404).json({
                error: "No sensor data found"
            });
        }

        res.json(rows[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
});

app.get("/api/sensor-data/recent", async (req, res) => {
  // Used by assets/js/live-chart.js for the dashboard "Live Overview" chart
  const minutes = parseInt(req.query.minutes) || 60;
  const [rows] = await pool.query(
    `SELECT vehicle_id, temperature, humidity, recorded_at
     FROM sensor_readings
     WHERE recorded_at >= NOW() - INTERVAL ? MINUTE
     ORDER BY recorded_at ASC`,
    [minutes]
  );
  res.json(rows);
});

// =====================================================================
// ALERTS  (used by alerts/alerts.html + dashboard "Recent Alerts")
// =====================================================================
app.get("/api/alerts", async (req, res) => {
  const [rows] = await pool.query(`
    SELECT a.id, a.created_at AS time, v.plate_number AS vehicle,
           a.alert_type AS type, a.message, a.severity, a.status
    FROM alerts a
    JOIN vehicles v ON v.id = a.vehicle_id
    ORDER BY a.created_at DESC
  `);
  res.json(rows);
});

// =====================================================================
// REPORTS  (used by reports/reports.html)
// =====================================================================
app.get("/api/reports", async (req, res) => {
  const { vehicle, from, to } = req.query;
  const [rows] = await pool.query(`
    SELECT v.plate_number AS vehicle,
           ROUND(AVG(sr.temperature),1) AS avgTemp,
           ROUND(AVG(sr.humidity),0)    AS avgHumidity,
           ROUND(MIN(sr.temperature),1) AS minTemp,
           ROUND(MAX(sr.temperature),1) AS maxTemp,
           (SELECT COUNT(*) FROM alerts al WHERE al.vehicle_id = v.id
              AND al.created_at BETWEEN ? AND ?) AS totalAlerts
    FROM vehicles v
    JOIN sensor_readings sr ON sr.vehicle_id = v.id
    WHERE sr.recorded_at BETWEEN ? AND ?
      AND (? = 'All Vehicles' OR v.plate_number = ?)
    GROUP BY v.id
  `, [from, to, from, to, vehicle, vehicle]);
  res.json(rows);
});

// =====================================================================
// ANALYTICS SUMMARY  (used by analytics/analytics.html + dashboard cards)
// =====================================================================
app.get("/api/analytics/summary", async (req, res) => {
  const [[summary]] = await pool.query(`
    SELECT ROUND(AVG(temperature),1) AS avgTemp,
           ROUND(AVG(humidity),0)    AS avgHumidity
    FROM sensor_readings
    WHERE recorded_at >= NOW() - INTERVAL 7 DAY
  `);
  const [[alertCount]] = await pool.query(`
    SELECT COUNT(*) AS totalAlerts FROM alerts
    WHERE created_at >= NOW() - INTERVAL 7 DAY
  `);
  res.json({ ...summary, ...alertCount });
});

// =====================================================================
// DRIVERS  (used by drivers/drivers.html)
// =====================================================================
app.get("/api/drivers", async (req, res) => {
  const [rows] = await pool.query(`
    SELECT d.name, d.phone, d.license_no AS license, d.status,
           v.plate_number AS vehicle
    FROM drivers d
    LEFT JOIN vehicles v ON v.driver_id = d.id
  `);
  res.json(rows);
});

// =====================================================================
// MAINTENANCE  (used by maintenance/maintenance.html)
// =====================================================================
app.get("/api/maintenance", async (req, res) => {
  const [rows] = await pool.query(`
    SELECT v.plate_number AS vehicle, m.task, m.due_date AS dueDate, m.status
    FROM maintenance_logs m
    JOIN vehicles v ON v.id = m.vehicle_id
    ORDER BY m.due_date ASC
  `);
  res.json(rows);
});

// =====================================================================
// SETTINGS  (used by settings/settings.html)
// =====================================================================
app.get("/api/settings/general", async (req, res) => {
  const [[settings]] = await pool.query("SELECT * FROM app_settings WHERE id = 1");
  res.json(settings);
});

app.put("/api/settings/general", async (req, res) => {
  const { companyName, updateIntervalSec, timezone, theme } = req.body;
  await pool.query(
    `UPDATE app_settings SET company_name = ?, update_interval_sec = ?,
     timezone = ?, theme = ? WHERE id = 1`,
    [companyName, updateIntervalSec, timezone, theme]
  );
  res.json({ ok: true });
});

app.put("/api/settings/thresholds", async (req, res) => {
  const { vehicleId, minTemperature, maxTemperature, maxHumidity, offlineTimeoutMins } = req.body;
  await pool.query(
    `UPDATE thresholds SET min_temperature = ?, max_temperature = ?,
     max_humidity = ?, offline_timeout_mins = ?
     WHERE vehicle_id ${vehicleId ? "= ?" : "IS NULL"}`,
    vehicleId
      ? [minTemperature, maxTemperature, maxHumidity, offlineTimeoutMins, vehicleId]
      : [minTemperature, maxTemperature, maxHumidity, offlineTimeoutMins]
  );
  res.json({ ok: true });
});

// =====================================================================
// PROFILE  (used by profile/profile.html)
// =====================================================================
app.put("/api/profile", async (req, res) => {
  const { userId, name, email, phone } = req.body; // userId from decoded JWT in real app
  await pool.query(
    "UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?",
    [name, email, phone, userId]
  );
  res.json({ ok: true });
});

app.post("/api/profile/change-password", async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;
  const [[user]] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);
  if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
    return res.status(401).json({ error: "Current password incorrect" });
  }
  const newHash = await bcrypt.hash(newPassword, 10);
  await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, userId]);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 6060;
app.listen(PORT, () => console.log(`ColdChain Monitor API listening on port ${PORT}`));
