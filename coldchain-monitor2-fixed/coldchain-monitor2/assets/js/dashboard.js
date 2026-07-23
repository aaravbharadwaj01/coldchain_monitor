// =====================================================================
// ColdChain Monitor — Shared UI Behaviour (every dashboard page)
// =====================================================================

// ---------------------------------------------------------------------
// 🔒 Simple auth guard — keeps the demo login functional.
// 🔌 INTEGRATION POINT: replace localStorage check with a real session/
// JWT check against the backend (e.g. GET /api/auth/me) once the SQL
// `users` table + login endpoint in backend/api/server.js is live.
// ---------------------------------------------------------------------
(function authGuard(){
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  if(!isLoggedIn){
    window.location.href = "../login/login.html";
  }
})();

// ---------------------------------------------------------------------
// Highlight the active sidebar link based on current page
// ---------------------------------------------------------------------
document.querySelectorAll(".nav-link").forEach(link=>{
  const linkPage = link.getAttribute("href").split("/").pop();
  const currentPage = window.location.pathname.split("/").pop();
  const item = link.closest(".nav-item");
  if(linkPage === currentPage){
    document.querySelectorAll(".nav-item").forEach(i=>i.classList.remove("active"));
    item.classList.add("active");
  }
});

// ---------------------------------------------------------------------
// Admin profile dropdown (topbar)
// ---------------------------------------------------------------------
const profileToggle = document.getElementById('profileToggle');
const profileDropdown = document.getElementById('profileDropdown');

if(profileToggle){
  profileToggle.addEventListener('click', (e)=>{
    e.stopPropagation();
    profileToggle.classList.toggle('open');
  });

  if(profileDropdown){
    profileDropdown.addEventListener('click', (e)=> e.stopPropagation());
  }

  document.addEventListener('click', ()=>{
    profileToggle.classList.remove('open');
  });

  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape') profileToggle.classList.remove('open');
  });
}

// ---------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------
document.querySelectorAll("#logoutLink, .logout-item").forEach(el=>{
  el.addEventListener("click", (e)=>{
    e.preventDefault();
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("loggedInUser");
    window.location.href = "../login/login.html";
  });
});

// ---------------------------------------------------------------------
// Tabs (used on Settings + Profile pages)
// ---------------------------------------------------------------------
document.querySelectorAll(".tabs").forEach(tabGroup=>{
  const tabs = tabGroup.querySelectorAll(".tab");
  tabs.forEach(tab=>{
    tab.addEventListener("click", ()=>{
      tabs.forEach(t=>t.classList.remove("active"));
      tab.classList.add("active");
      const targetId = tab.getAttribute("data-tab");
      const panels = document.querySelectorAll(`.tab-panel[data-group="${tabGroup.dataset.group}"]`);
      panels.forEach(p=>p.classList.remove("active"));
      const target = document.getElementById(targetId);
      if(target) target.classList.add("active");
    });
  });
});

// =====================================================================
// Notification bell (topbar, every page) — shows recent alerts
// 🔌 INTEGRATION POINT: this reads getAlerts() from mockData.js, which
// will map to GET /api/alerts once the backend is live.
// =====================================================================
(function initBell(){
  const bellWrap = document.getElementById("bellToggle");
  const bellDropdown = document.getElementById("bellDropdown");
  const bellList = document.getElementById("bellList");
  const bellDot = document.getElementById("bellDot");
  if(!bellWrap) return;

  bellWrap.addEventListener("click", (e)=>{
    e.stopPropagation();
    bellWrap.classList.toggle("open");
  });
  if(bellDropdown){
    bellDropdown.addEventListener("click", (e)=> e.stopPropagation());
  }
  document.addEventListener("click", ()=> bellWrap.classList.remove("open"));
  document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape") bellWrap.classList.remove("open");
  });

  if(bellList && typeof getAlerts === "function"){
    getAlerts().then(alerts=>{
      if(bellDot) bellDot.style.display = alerts.some(a=>a.status === "Active") ? "block" : "none";

      if(!alerts.length){
        bellList.innerHTML = `<div class="bell-empty">No alerts yet</div>`;
        return;
      }

      bellList.innerHTML = alerts.slice(0, 5).map(a => `
        <div class="bell-item">
          <div class="bell-item-top">
            <span class="bell-item-vehicle">${a.vehicle}</span>
            <span class="bell-item-time">${a.time}</span>
          </div>
          <span class="bell-item-message">${a.type} — ${a.message}</span>
        </div>
      `).join("");
    });
  }
})();

// =====================================================================
// Generic modal helper — used by Add Vehicle / Add Driver /
// Schedule Maintenance modals (and any future modal following the same
// data-modal-open / data-modal-close pattern).
// =====================================================================
function openModal(modalId){
  const overlay = document.getElementById(modalId);
  if(overlay) overlay.classList.add("open");
}
function closeModal(modalId){
  const overlay = document.getElementById(modalId);
  if(overlay) overlay.classList.remove("open");
}
document.querySelectorAll("[data-modal-open]").forEach(btn=>{
  btn.addEventListener("click", ()=> openModal(btn.getAttribute("data-modal-open")));
});
document.querySelectorAll("[data-modal-close]").forEach(btn=>{
  btn.addEventListener("click", ()=> closeModal(btn.getAttribute("data-modal-close")));
});
document.querySelectorAll(".modal-overlay").forEach(overlay=>{
  overlay.addEventListener("click", (e)=>{
    if(e.target === overlay) overlay.classList.remove("open");
  });
});
document.addEventListener("keydown", (e)=>{
  if(e.key === "Escape"){
    document.querySelectorAll(".modal-overlay.open").forEach(o=> o.classList.remove("open"));
  }
});

// =====================================================================
// THRESHOLDS — shared storage helpers
// 🔌 INTEGRATION POINT: swap localStorage for PUT/GET /api/settings/thresholds
// (see backend/api/server.js) once the backend + `thresholds` SQL table
// are live. Every page that reads/writes thresholds goes through these
// two functions so the swap only has to happen in one place.
// =====================================================================
const THRESHOLDS_KEY = "coldchain_thresholds";
const TIMEOUT_COUNT_KEY = "coldchain_sensorTimeoutCount";
const LAST_READING_KEY = "coldchain_lastReadingTs";
const TIMEOUT_FLAG_KEY = "coldchain_timeoutFlagged";

function getThresholds(){
  try{
    const raw = localStorage.getItem(THRESHOLDS_KEY);
    if(raw) return JSON.parse(raw);
  }catch(e){ /* fall through to defaults */ }
  return { minTemp: 2, maxTemp: 8, maxHumidity: 70, offlineTimeoutMins: 10 };
}

function saveThresholds(t){
  localStorage.setItem(THRESHOLDS_KEY, JSON.stringify(t));
}

function getTimeoutCount(){
  return Number(localStorage.getItem(TIMEOUT_COUNT_KEY) || 0);
}

function setTimeoutCount(n){
  localStorage.setItem(TIMEOUT_COUNT_KEY, String(n));
  updateTimeoutDisplays();
}

function updateTimeoutDisplays(){
  const n = getTimeoutCount();
  const dashEl = document.getElementById("sensorTimeouts");
  if(dashEl) dashEl.textContent = n;
  const settingsEl = document.getElementById("sensorTimeoutCountField");
  if(settingsEl) settingsEl.value = n;
}

// =====================================================================
// SETTINGS PAGE — Thresholds tab (Save Changes now actually persists,
// and the live dashboard poll compares readings against these values)
// =====================================================================
(function initThresholdsPage(){
  const form = document.getElementById("thresholdsForm");
  if(!form) return;

  const minInput = document.getElementById("minTempInput");
  const maxInput = document.getElementById("maxTempInput");
  const humInput = document.getElementById("maxHumidityInput");
  const timeoutInput = document.getElementById("offlineTimeoutInput");
  const savedMsg = document.getElementById("thresholdsSavedMsg");
  const errorMsg = document.getElementById("thresholdsError");
  const resetBtn = document.getElementById("resetTimeoutCountBtn");

  const current = getThresholds();
  if(minInput) minInput.value = current.minTemp;
  if(maxInput) maxInput.value = current.maxTemp;
  if(humInput) humInput.value = current.maxHumidity;
  if(timeoutInput) timeoutInput.value = current.offlineTimeoutMins;
  updateTimeoutDisplays();

  form.addEventListener("submit", (e)=>{
    e.preventDefault();

    const minTemp = parseFloat(minInput.value);
    const maxTemp = parseFloat(maxInput.value);
    const maxHumidity = parseFloat(humInput.value);
    const offlineTimeoutMins = parseFloat(timeoutInput.value);

    function showError(msg){
      if(errorMsg){ errorMsg.textContent = msg; errorMsg.style.display = "block"; }
      if(savedMsg) savedMsg.style.display = "none";
    }

    if([minTemp, maxTemp, maxHumidity, offlineTimeoutMins].some(v => Number.isNaN(v))){
      showError("Please enter a valid number for every field.");
      return;
    }
    if(minTemp >= maxTemp){
      showError("Min Temperature must be lower than Max Temperature.");
      return;
    }
    if(offlineTimeoutMins <= 0){
      showError("Sensor Offline Timeout must be greater than 0.");
      return;
    }

    if(errorMsg) errorMsg.style.display = "none";
    saveThresholds({ minTemp, maxTemp, maxHumidity, offlineTimeoutMins });

    if(savedMsg){
      savedMsg.style.display = "inline";
      setTimeout(()=> savedMsg.style.display = "none", 2500);
    }
  });

  if(resetBtn){
    resetBtn.addEventListener("click", ()=>{
      setTimeoutCount(0);
      localStorage.setItem(TIMEOUT_FLAG_KEY, "false");
    });
  }
})();

// =====================================================================
// DASHBOARD PAGE — working "Search Vehicle / City" + status filter
// =====================================================================
(function initDashboardSearch(){
  const grid = document.getElementById("dashboardVehiclesGrid");
  if(!grid) return;

  const searchInput = document.getElementById("dashboardSearchInput");
  const statusFilter = document.getElementById("dashboardStatusFilter");
  const searchBtn = document.getElementById("dashboardSearchBtn");
  const noResults = document.getElementById("dashboardNoResults");

  function applyFilter(){
    const query = (searchInput ? searchInput.value : "").trim().toLowerCase();
    const status = statusFilter ? statusFilter.value : "All Status";
    let visibleCount = 0;

    grid.querySelectorAll(".vehicle-card").forEach(card=>{
      const plate = (card.dataset.plate || "").toLowerCase();
      const city = (card.dataset.city || "").toLowerCase();
      const cardStatus = card.dataset.status || "";

      const matchesQuery = !query || plate.includes(query) || city.includes(query);
      const matchesStatus = status === "All Status" || cardStatus === status;
      const visible = matchesQuery && matchesStatus;

      card.style.display = visible ? "" : "none";
      if(visible) visibleCount++;
    });

    if(noResults) noResults.style.display = visibleCount ? "none" : "block";
  }

  if(searchBtn) searchBtn.addEventListener("click", applyFilter);
  if(searchInput) searchInput.addEventListener("keyup", applyFilter);
  if(statusFilter) statusFilter.addEventListener("change", applyFilter);
})();

// =====================================================================
// VEHICLES PAGE — working search bar
// =====================================================================
(function initVehiclesSearch(){
  const tbody = document.getElementById("vehiclesTableBody");
  const searchInput = document.getElementById("vehicleSearch");
  if(!tbody || !searchInput) return;

  const searchBtn = document.getElementById("vehicleSearchBtn");
  const noResults = document.getElementById("vehiclesNoResults");

  function applyFilter(){
    const query = searchInput.value.trim().toLowerCase();
    let visibleCount = 0;

    tbody.querySelectorAll("tr").forEach(row=>{
      const text = row.textContent.toLowerCase();
      const visible = !query || text.includes(query);
      row.style.display = visible ? "" : "none";
      if(visible) visibleCount++;
    });

    if(noResults) noResults.style.display = visibleCount ? "none" : "block";
  }

  if(searchBtn) searchBtn.addEventListener("click", applyFilter);
  searchInput.addEventListener("keyup", applyFilter);
})();

// =====================================================================
// ALERTS PAGE — working filters (vehicle / type / status / date)
// 🔌 INTEGRATION POINT: swap the client-side .filter() below for a
// GET /api/alerts?vehicle=...&type=...&status=...&date=... call once
// the backend is live — see getAlerts() in mockData.js.
// =====================================================================
(function initAlertsPage(){
  const tbody = document.getElementById("alertsTableBody");
  if(!tbody || typeof getAlerts !== "function") return;

  const vehicleFilter = document.getElementById("alertVehicleFilter");
  const typeFilter = document.getElementById("alertTypeFilter");
  const statusFilter = document.getElementById("alertStatusFilter");
  const dateFilter = document.getElementById("alertDateFilter");

  const severityClass = { High:"high", Medium:"medium", Low:"low" };
  const statusClass = { Active:"active", Resolved:"resolved" };

  let allAlerts = [];

  function render(){
    const vehicle = vehicleFilter ? vehicleFilter.value : "All Vehicles";
    const type = typeFilter ? typeFilter.value : "All Types";
    const status = statusFilter ? statusFilter.value : "All Status";
    const date = dateFilter ? dateFilter.value : "";

    const filtered = allAlerts.filter(a=>{
      if(vehicle !== "All Vehicles" && a.vehicle !== vehicle) return false;
      if(type !== "All Types" && a.type !== type) return false;
      if(status !== "All Status" && a.status !== status) return false;
      // Mock data only has one demo date, so the date filter narrows to
      // that day when the user actively changes it away from default.
      if(date && dateFilter && dateFilter.dataset.touched === "true" && date !== dateFilter.dataset.defaultValue) return false;
      return true;
    });

    if(!filtered.length){
      tbody.innerHTML = `<tr><td colspan="6" class="cell-muted" style="text-align:center;padding:28px;">No alerts match the selected filters.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(a => `
      <tr>
        <td class="cell-muted">${a.time}</td>
        <td class="cell-strong">${a.vehicle}</td>
        <td>${a.type}</td>
        <td class="cell-muted">${a.message}</td>
        <td><span class="pill ${severityClass[a.severity] || ''}">${a.severity}</span></td>
        <td><span class="pill ${statusClass[a.status] || ''}">${a.status}</span></td>
      </tr>
    `).join("");
  }

  getAlerts().then(alerts=>{
    allAlerts = alerts;
    if(dateFilter) dateFilter.dataset.defaultValue = dateFilter.value;
    render();
  });

  [vehicleFilter, typeFilter, statusFilter].forEach(el=>{
    if(el) el.addEventListener("change", render);
  });
  if(dateFilter){
    dateFilter.addEventListener("change", ()=>{
      dateFilter.dataset.touched = "true";
      render();
    });
  }

  const exportSelect = document.getElementById("alertExportSelect");
  if(exportSelect){
    exportSelect.addEventListener("change", ()=>{
      if(exportSelect.value !== "Export"){
        alert(`${exportSelect.value}: this demo build doesn't generate a real file yet, but the filtered rows currently shown would be exported.`);
        exportSelect.value = "Export";
      }
    });
  }
})();

// =====================================================================
// REPORTS PAGE — working filters (report type / vehicle / date range)
// 🔌 INTEGRATION POINT: swap the client-side filter below for
// getReportRows(reportType, vehicleFilter, dateRange) in mockData.js,
// which maps to GET /api/reports?type=...&vehicle=...&from=...&to=...
// =====================================================================
(function initReportsPage(){
  const tbody = document.getElementById("reportsTableBody");
  if(!tbody || typeof getReportRows !== "function") return;

  const typeFilter = document.getElementById("reportTypeFilter");
  const vehicleFilter = document.getElementById("reportVehicleFilter");
  const heading = document.getElementById("reportHeading");
  const tfootRow = document.getElementById("reportsTfootRow");

  function render(){
    const reportType = typeFilter ? typeFilter.value : "Daily Summary";
    const vehicle = vehicleFilter ? vehicleFilter.value : "All Vehicles";

    getReportRows(reportType, vehicle).then(rows=>{
      const filtered = vehicle === "All Vehicles" ? rows : rows.filter(r=>r.vehicle === vehicle);

      if(heading){
        heading.textContent = `${reportType} Report`;
      }

      if(!filtered.length){
        tbody.innerHTML = `<tr><td colspan="7" class="cell-muted" style="text-align:center;padding:28px;">No data for the selected filters.</td></tr>`;
        if(tfootRow) tfootRow.style.display = "none";
        return;
      }
      if(tfootRow) tfootRow.style.display = "";

      tbody.innerHTML = filtered.map(r => `
        <tr>
          <td class="cell-strong">${r.vehicle}</td>
          <td>${r.avgTemp}</td>
          <td>${r.avgHumidity}</td>
          <td>${r.minTemp}</td>
          <td>${r.maxTemp}</td>
          <td>${r.totalAlerts}</td>
          <td><span class="pill ${r.status.toLowerCase()}">${r.status}</span></td>
        </tr>
      `).join("");

      if(tfootRow){
        const avg = (key)=> (filtered.reduce((s,r)=>s+Number(r[key]),0) / filtered.length).toFixed(1);
        const totalAlerts = filtered.reduce((s,r)=>s+Number(r.totalAlerts),0);
        const minTemp = Math.min(...filtered.map(r=>r.minTemp));
        const maxTemp = Math.max(...filtered.map(r=>r.maxTemp));
        const cells = tfootRow.querySelectorAll("td");
        if(cells.length >= 6){
          cells[1].textContent = avg("avgTemp");
          cells[2].textContent = avg("avgHumidity");
          cells[3].textContent = minTemp;
          cells[4].textContent = maxTemp;
          cells[5].textContent = totalAlerts;
        }
      }
    });
  }

  render();
  [typeFilter, vehicleFilter].forEach(el=>{
    if(el) el.addEventListener("change", render);
  });

  const exportBtn = document.getElementById("exportReportBtn");
  if(exportBtn){
    exportBtn.addEventListener("click", ()=>{
      alert("This demo build doesn't generate a real file yet, but the report currently shown would be exported.");
    });
  }
})();

// =====================================================================
// VEHICLES PAGE — Add Vehicle modal
// 🔌 INTEGRATION POINT: swap the client-side push below for
// POST /api/vehicles (see backend/api/server.js), then re-fetch
// getVehicles() from mockData.js.
// =====================================================================
(function initVehiclesPage(){
  const tbody = document.getElementById("vehiclesTableBody");
  const form = document.getElementById("addVehicleForm");
  if(!tbody || !form) return;

  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    const plate = document.getElementById("vehiclePlateInput").value.trim();
    const route = document.getElementById("vehicleRouteInput").value.trim();
    const driver = document.getElementById("vehicleDriverInput").value.trim();
    const status = document.getElementById("vehicleStatusInput").value;
    if(!plate) return;

    const statusClass = status === "Online" ? "online" : "offline";
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}) + ", " +
                       now.toLocaleDateString([], {day:"2-digit", month:"short", year:"numeric"});

    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="cell-strong">${plate}</td>
      <td>${route || "—"}</td>
      <td>${driver || "—"}</td>
      <td><span class="pill ${statusClass}">${status}</span></td>
      <td class="cell-muted">${timestamp}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" title="Edit">✎</button>
          <button class="icon-btn danger" title="Delete">🗑</button>
        </div>
      </td>
    `;
    tbody.appendChild(row);

    form.reset();
    closeModal("addVehicleModal");
  });
})();

// =====================================================================
// DRIVERS PAGE — Add Driver modal
// 🔌 INTEGRATION POINT: swap the client-side push below for
// POST /api/drivers (see backend/api/server.js), then re-fetch
// getDrivers() from mockData.js.
// =====================================================================
(function initDriversPage(){
  const tbody = document.getElementById("driversTableBody");
  const form = document.getElementById("addDriverForm");
  if(!tbody || !form) return;

  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    const name = document.getElementById("driverNameInput").value.trim();
    const phone = document.getElementById("driverPhoneInput").value.trim();
    const vehicle = document.getElementById("driverVehicleInput").value.trim();
    const license = document.getElementById("driverLicenseInput").value.trim();
    const status = document.getElementById("driverStatusInput").value;
    if(!name) return;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="cell-strong">${name}</td>
      <td class="cell-muted">${phone || "—"}</td>
      <td>${vehicle || "—"}</td>
      <td class="cell-muted">${license || "—"}</td>
      <td><span class="pill healthy">${status}</span></td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" title="Edit">✎</button>
          <button class="icon-btn danger" title="Delete">🗑</button>
        </div>
      </td>
    `;
    tbody.appendChild(row);

    form.reset();
    closeModal("addDriverModal");
  });
})();

// =====================================================================
// MAINTENANCE PAGE — Schedule Maintenance modal
// 🔌 INTEGRATION POINT: swap the client-side push below for
// POST /api/maintenance (see backend/api/server.js), then re-fetch
// getMaintenanceLogs() from mockData.js.
// =====================================================================
(function initMaintenancePage(){
  const tbody = document.getElementById("maintenanceTableBody");
  const form = document.getElementById("scheduleMaintenanceForm");
  if(!tbody || !form) return;

  const statusPillClass = { "Upcoming":"healthy", "Due Soon":"warning", "Overdue":"critical", "Completed":"healthy" };

  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    const vehicle = document.getElementById("maintenanceVehicleInput").value.trim();
    const task = document.getElementById("maintenanceTaskInput").value.trim();
    const dueDateRaw = document.getElementById("maintenanceDueDateInput").value;
    const status = document.getElementById("maintenanceStatusInput").value;
    if(!vehicle || !task || !dueDateRaw) return;

    const dueDate = new Date(dueDateRaw).toLocaleDateString([], {day:"2-digit", month:"short", year:"numeric"});

    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="cell-strong">${vehicle}</td>
      <td>${task}</td>
      <td class="cell-muted">${dueDate}</td>
      <td><span class="pill ${statusPillClass[status] || 'healthy'}">${status}</span></td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" title="Edit">✎</button>
          <button class="icon-btn danger" title="Delete">🗑</button>
        </div>
      </td>
    `;
    tbody.appendChild(row);

    form.reset();
    closeModal("scheduleMaintenanceModal");
  });
})();



// =====================================================================
// LIVE DASHBOARD DATA
// =====================================================================

async function loadDashboardData() {
    const thresholds = getThresholds();
    const banner = document.getElementById("thresholdAlertBanner");

    try {
        const response = await fetch("https://coldchain-monitor.onrender.com/api/latest");

        if (!response.ok) {
            throw new Error("Failed to fetch sensor data");
        }

        const data = await response.json();

        // A reading came through successfully, so the sensor isn't timed
        // out right now — reset the timeout tracking.
        localStorage.setItem(LAST_READING_KEY, String(Date.now()));
        localStorage.setItem(TIMEOUT_FLAG_KEY, "false");

        // Temperature
        const tempEl = document.getElementById("avgTemperature");
        if(tempEl) tempEl.textContent = data.temperature + " °C";

        // Humidity
        const humEl = document.getElementById("avgHumidity");
        if(humEl) humEl.textContent = data.humidity + " %";

        // You can update these later from database APIs
        const totalEl = document.getElementById("totalVehicles");
        if(totalEl) totalEl.textContent = "1";
        const onlineEl = document.getElementById("onlineVehicles");
        if(onlineEl) onlineEl.textContent = "1";

        // ---------------------------------------------------------------
        // 🔌 Threshold check — alerts if temperature is above/below the
        // Min/Max Temperature set on Settings > Thresholds.
        // ---------------------------------------------------------------
        const temp = Number(data.temperature);
const humidity = Number(data.humidity);

let messages = [];

// Temperature
if (!Number.isNaN(temp)) {

    if (temp > thresholds.maxTemp) {
        messages.push(
            `⚠️ Temperature High: ${temp}°C is above the max threshold of ${thresholds.maxTemp}°C`
        );
    }

    if (temp < thresholds.minTemp) {
        messages.push(
            `⚠️ Temperature Low: ${temp}°C is below the min threshold of ${thresholds.minTemp}°C`
        );
    }
}

// Humidity
if (!Number.isNaN(humidity)) {

    if (humidity > thresholds.maxHumidity) {
        messages.push(
            `💧 Humidity High: ${humidity}% is above the max threshold of ${thresholds.maxHumidity}%`
        );
    }
}

// Banner
if (banner) {

    if (messages.length > 0) {
        banner.innerHTML = messages.join("<br>");
        banner.style.display = "flex";
    } else {
        banner.style.display = "none";
    }
}

// Active Alert Count
const alertsEl = document.getElementById("activeAlerts");
if (alertsEl) {
    alertsEl.textContent = messages.length;
}

       
    } catch (error) {
        console.error("Dashboard Error:", error);
        if(banner){
            banner.textContent = "⚠️ Unable to reach the sensor feed — check that the backend is running.";
            banner.style.display = "flex";
        }
    }

    // ---------------------------------------------------------------------
    // 🔌 Sensor timeout count — increments once per timeout *event* (not
    // every poll) when no reading has come in for longer than the
    // "Sensor Offline Timeout" set on Settings > Thresholds.
    // ---------------------------------------------------------------------
    const lastTs = Number(localStorage.getItem(LAST_READING_KEY) || 0);
    const timeoutMs = (thresholds.offlineTimeoutMins || 10) * 60 * 1000;
    const alreadyFlagged = localStorage.getItem(TIMEOUT_FLAG_KEY) === "true";

    if(lastTs && (Date.now() - lastTs > timeoutMs) && !alreadyFlagged){
        setTimeoutCount(getTimeoutCount() + 1);
        localStorage.setItem(TIMEOUT_FLAG_KEY, "true");
    }
    updateTimeoutDisplays();
}

// Only poll the live sensor feed on the Dashboard page itself.
if(document.getElementById("avgTemperature")){
    // Load immediately
    loadDashboardData();

    // Refresh every 2 seconds
    setInterval(loadDashboardData, 2000);
} else {
    // Not the dashboard — still keep the Sensor Timeout Count field on the
    // Settings > Thresholds tab in sync with whatever the dashboard's
    // polling loop last recorded.
    updateTimeoutDisplays();
}
async function loadAlertsFromAPI(){

    try {

        const response = await fetch(
            "https://coldchain-monitor.onrender.com/api/alerts"
        );

        const alerts = await response.json();


        // -------- Alerts table --------

        const table = document.getElementById("alertsTableBody");

        if(table){

            table.innerHTML = "";

            alerts.forEach(alert => {

                table.innerHTML += `
                <tr>
                    <td class="cell-muted">
                        ${alert.time}
                    </td>

                    <td class="cell-strong">
                        ${alert.vehicle}
                    </td>

                    <td>
                        ${alert.type}
                    </td>

                    <td class="cell-muted">
                        ${alert.message}
                    </td>

                    <td>
                        <span class="pill ${alert.severity.toLowerCase()}">
                            ${alert.severity}
                        </span>
                    </td>

                    <td>
                        <span class="pill ${alert.status.toLowerCase()}">
                            ${alert.status}
                        </span>
                    </td>

                </tr>
                `;

            });

        }



        // -------- Bell dropdown --------

        const bell = document.getElementById("bellList");

        if(bell){

            bell.innerHTML="";

            alerts.slice(0,5).forEach(alert=>{

                bell.innerHTML += `

                <div class="bell-item">

                    <strong>
                    ${alert.type}
                    </strong>

                    <br>

                    ${alert.vehicle}

                    <br>

                    <small>
                    ${alert.message}
                    </small>

                </div>

                `;

            });

        }



        // -------- Bell red dot --------

        const dot = document.getElementById("bellDot");

        if(dot){

            if(alerts.length > 0){
                dot.style.display="block";
            }
            else{
                dot.style.display="none";
            }

        }


    }
    catch(error){

        console.error(
            "Alert API error:",
            error
        );

    }

}


loadAlertsFromAPI();
