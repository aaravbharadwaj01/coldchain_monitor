const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const axios = require("axios");

// ===============================
// ESP32 COM Port
// ===============================

const port = new SerialPort({
    path: "COM4",
    baudRate: 115200
});

// Read one line at a time
const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

console.log("Waiting for ESP32 data on COM4...");

parser.on("data", async (line) => {

    line = line.trim();

    // Ignore normal text
    if (!line.startsWith("{")) {
        console.log(line);
        return;
    }

    try {

        const json = JSON.parse(line);

        console.log("Received:", json);

        const response = await axios.post(
            "https://coldchain-monitor.onrender.com/api/sensor-data",
            json
        );

        console.log("Uploaded Successfully:", response.data);

    } catch (err) {

    console.log("========== ERROR ==========");

    console.log("Message:", err.message);

    if (err.code)
        console.log("Code:", err.code);

    if (err.response) {
        console.log("Status:", err.response.status);
        console.log("Response:", err.response.data);
    }

    console.log("===========================");

}
});
