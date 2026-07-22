//=====================================================
// USB Version (No Wi-Fi)
//=====================================================

//#include <WiFi.h>
//#include <HTTPClient.h>

#include <DHT.h>
#include <ArduinoJson.h>

//======================
// WiFi Configuration
//======================

//const char* WIFI_SSID = "mayank-pc";
//const char* WIFI_PASSWORD = "Mayank21";

//======================
// Backend Configuration
//======================

//const char* API_ENDPOINT = "http://172.20.10.2:6000/api/sensor-data";

const char* DEVICE_ID = "ESP32-CC-001";

//======================
// Sensor Pins
//======================

#define DHTPIN 4
#define DHTTYPE DHT11

#define DOOR_PIN 5

//======================
// Update Interval
//======================

// Change back to 60000 after testing
const unsigned long UPDATE_INTERVAL_MS = 6000;

DHT dht(DHTPIN, DHTTYPE);

//================================================

void setup() {

  Serial.begin(115200);

  dht.begin();

  pinMode(DOOR_PIN, INPUT_PULLUP);

  Serial.println();
  Serial.println("ColdChain Monitor Started");
  Serial.println("USB Serial Mode");
}

//================================================

void loop() {

  float temperature = dht.readTemperature();

  float humidity = dht.readHumidity();

  bool doorOpen = digitalRead(DOOR_PIN) == LOW;

  if (isnan(temperature) || isnan(humidity)) {

    Serial.println("Failed to read DHT22");

  } else {

    // Display readings
    Serial.println("---------------------------");
    Serial.print("Temperature : ");
    Serial.print(temperature);
    Serial.println(" °C");

    Serial.print("Humidity : ");
    Serial.print(humidity);
    Serial.println(" %");

    Serial.print("Door : ");
    Serial.println(doorOpen ? "OPEN" : "CLOSED");

    // Send JSON through USB Serial
    sendReading(temperature, humidity, doorOpen);

  }

  delay(UPDATE_INTERVAL_MS);
}

//================================================
// USB Serial Output
//================================================

void sendReading(float temperature, float humidity, bool doorOpen) {

  StaticJsonDocument<256> doc;

  doc["device_id"] = DEVICE_ID;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["door_open"] = doorOpen;

  serializeJson(doc, Serial);

  Serial.println();

}