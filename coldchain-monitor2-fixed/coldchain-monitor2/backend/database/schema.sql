-- =====================================================================
-- ColdChain Monitor — SQL Database Schema (MySQL 8.0 / MariaDB)
-- ---------------------------------------------------------------------
-- This schema backs every "🔌 INTEGRATION POINT" comment found in the
-- front-end (assets/js/mockData.js and each page's HTML/JS). Every
-- table here corresponds 1:1 with a getX() function or table shown on
-- a page.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS coldchain_monitor;
USE coldchain_monitor;

-- ---------------------------------------------------------------------
-- USERS  (login / profile pages)
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL UNIQUE,
  phone         VARCHAR(30),
  password_hash VARCHAR(255) NOT NULL,      -- bcrypt hash, never plain text
  role          ENUM('Administrator','Manager','Viewer') DEFAULT 'Viewer',
  photo_url     VARCHAR(255),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- VEHICLES  (vehicles page, dashboard vehicle cards)
-- ---------------------------------------------------------------------
CREATE TABLE vehicles (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  plate_number  VARCHAR(20) NOT NULL UNIQUE,   -- e.g. "RJ14 AB 4587"
  route         VARCHAR(120),                  -- e.g. "Jaipur — Ajmer"
  driver_id     INT,
  device_id     VARCHAR(60) UNIQUE,            -- ESP32 unique device/chip ID
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------
-- DRIVERS  (drivers page)
-- ---------------------------------------------------------------------
CREATE TABLE drivers (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  phone         VARCHAR(30),
  license_no    VARCHAR(60),
  status        ENUM('On Duty','Off Duty') DEFAULT 'Off Duty',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- SENSOR_READINGS  (populated directly by ESP32 devices)
-- This is the single most important table: every ESP32 POST
-- (see backend/esp32/esp32_coldchain.ino) results in exactly one INSERT
-- here. Analytics, Reports, the Live Overview chart, and the Vehicle
-- "current temperature/humidity" values are all derived from this table.
-- ---------------------------------------------------------------------
CREATE TABLE sensor_readings (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id    INT NOT NULL,
  temperature   DECIMAL(5,2) NOT NULL,   -- °C
  humidity      DECIMAL(5,2) NOT NULL,   -- %
  door_open     BOOLEAN DEFAULT FALSE,
  recorded_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  INDEX idx_vehicle_time (vehicle_id, recorded_at)
);

-- ---------------------------------------------------------------------
-- THRESHOLDS  (Settings > Thresholds tab)
-- ---------------------------------------------------------------------
CREATE TABLE thresholds (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id           INT NULL,          -- NULL = global default for all vehicles
  min_temperature      DECIMAL(5,2) DEFAULT 2,
  max_temperature      DECIMAL(5,2) DEFAULT 8,
  max_humidity         DECIMAL(5,2) DEFAULT 70,
  offline_timeout_mins INT DEFAULT 10,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- ALERTS  (alerts page, dashboard "Recent Alerts")
-- Rows are INSERTed by the backend's alert-evaluation logic the moment
-- an incoming sensor_readings value breaches a `thresholds` row, or a
-- device stops sending data for longer than offline_timeout_mins.
-- ---------------------------------------------------------------------
CREATE TABLE alerts (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id    INT NOT NULL,
  alert_type    ENUM('Temperature High','Temperature Low','Humidity High','Sensor Offline','Door Open') NOT NULL,
  message       VARCHAR(255) NOT NULL,
  severity      ENUM('Low','Medium','High') NOT NULL,
  status        ENUM('Active','Resolved') DEFAULT 'Active',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at   TIMESTAMP NULL,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  INDEX idx_vehicle_status (vehicle_id, status)
);

-- ---------------------------------------------------------------------
-- MAINTENANCE_LOGS  (maintenance page)
-- ---------------------------------------------------------------------
CREATE TABLE maintenance_logs (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id    INT NOT NULL,
  task          VARCHAR(160) NOT NULL,
  due_date      DATE NOT NULL,
  status        ENUM('Upcoming','Due Soon','Overdue','Completed') DEFAULT 'Upcoming',
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- APP_SETTINGS  (Settings > General / Email-SMS tabs — single row)
-- ---------------------------------------------------------------------
CREATE TABLE app_settings (
  id                  INT PRIMARY KEY DEFAULT 1,
  company_name        VARCHAR(160),
  update_interval_sec INT DEFAULT 60,
  timezone            VARCHAR(60) DEFAULT '(UTC +05:30) Asia/Kolkata',
  theme               ENUM('Light','Dark') DEFAULT 'Light',
  notify_email        VARCHAR(160),
  notify_phone        VARCHAR(30)
);

-- ---------------------------------------------------------------------
-- Example seed data matching the demo shown in the front-end
-- ---------------------------------------------------------------------
INSERT INTO drivers (name, phone, license_no, status) VALUES
  ('Mohan Singh', '+91 98765 43210', 'RJ-0420190001234', 'On Duty'),
  ('Rakesh Kumar', '+91 91234 56780', 'DL-0320180005678', 'On Duty');

INSERT INTO vehicles (plate_number, route, driver_id, device_id) VALUES
  ('RJ14 AB 4587', 'Jaipur — Ajmer', 1, 'ESP32-CC-001'),
  ('DL1L AB 1234', 'Delhi — Alwar', 2, 'ESP32-CC-002');

INSERT INTO thresholds (vehicle_id, min_temperature, max_temperature, max_humidity, offline_timeout_mins) VALUES
  (NULL, 2, 8, 70, 10);   -- global default row
