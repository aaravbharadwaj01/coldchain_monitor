async function loadAnalytics() {
    try {
        console.log("Loading Analytics...");

        const response = await fetch("http://localhost:6060/api/sensor-data/recent");

        if (!response.ok) {
            throw new Error("Failed to fetch analytics data");
        }

        const data = await response.json();

        console.log("API Response:", data);

        if (!Array.isArray(data) || data.length === 0) {
            console.log("No sensor data found.");
            return;
        }

        // Temperature & Humidity arrays
        const temps = data.map(item => Number(item.temperature));
        const hums = data.map(item => Number(item.humidity));

        // Calculate averages
        const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
        const avgHumidity = hums.reduce((a, b) => a + b, 0) / hums.length;

        // Helper function
        function setValue(id, value) {
            const element = document.getElementById(id);

            if (element) {
                element.textContent = value;
            } else {
                console.warn(`Element not found: ${id}`);
            }
        }

        // Summary Cards
        setValue("avgTemp", avgTemp.toFixed(2) + " °C");
        setValue("avgHumidity", avgHumidity.toFixed(2) + " %");
        setValue("totalAlerts", "0");
        setValue("uptime", "100 %");

        // Vehicle 1
        setValue("vehicle1Temp", temps[0].toFixed(1) + "°C");
        setValue("vehicle1Humidity", hums[0].toFixed(1) + "%");

        // Vehicle 2
        if (temps.length > 1) {
            setValue("vehicle2Temp", temps[1].toFixed(1) + "°C");
            setValue("vehicle2Humidity", hums[1].toFixed(1) + "%");
        }

        console.log("Analytics Updated Successfully");

    } catch (error) {
        console.error("Analytics Error:", error);
    }
}

// Load immediately
loadAnalytics();

// Refresh every 2 seconds
setInterval(loadAnalytics, 2000);