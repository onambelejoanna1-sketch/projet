/*
 * Alerte Douala — Capteur ESP32 anti-inondation
 *
 * Mesure 3 paramètres (niveau d'eau, pluviométrie, humidité du sol) et envoie les lectures
 * à la Cloud Function `ingestSensorReading` toutes les 60 s via HTTPS.
 *
 * Capteurs :
 *   - Niveau d'eau   : HC-SR04 (ultrason) — TRIG=GPIO5, ECHO=GPIO18
 *   - Pluviométrie   : YL-83 (analogique) — A0 sur GPIO34
 *   - Humidité sol   : capacitif v2.0    — A1 sur GPIO35
 *
 * Configuration : copier config.h.example en config.h et renseigner WiFi + URL + clé API.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "config.h"

// --- Pins ---
constexpr int PIN_TRIG = 5;
constexpr int PIN_ECHO = 18;
constexpr int PIN_RAIN = 34;     // ADC1_CH6
constexpr int PIN_SOIL = 35;     // ADC1_CH7
constexpr int PIN_BATTERY = 33;  // diviseur de tension batterie

// --- Calibration ---
constexpr float WATER_FULL_CM = 5.0;   // capteur sous l'eau au max → 5 cm
constexpr float WATER_EMPTY_CM = 200.0; // capteur loin de l'eau → 200 cm
constexpr int RAIN_DRY = 4095;          // ADC sec
constexpr int RAIN_WET = 1500;          // ADC trempé
constexpr int SOIL_DRY = 3500;          // ADC sol sec
constexpr int SOIL_WET = 1200;          // ADC sol détrempé

constexpr unsigned long PUBLISH_INTERVAL_MS = 60UL * 1000UL;
unsigned long lastPublish = 0;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  analogReadResolution(12);

  Serial.printf("Connexion WiFi à %s...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 30000) {
    delay(500);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WiFi] OK — IP %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n[WiFi] Échec — redémarrage dans 10 s");
    delay(10000);
    ESP.restart();
  }
}

void loop() {
  unsigned long now = millis();
  if (now - lastPublish < PUBLISH_INTERVAL_MS && lastPublish != 0) {
    delay(200);
    return;
  }
  lastPublish = now;

  float waterPct = readWaterLevel();
  float rainfall = readRainfall();
  float soilPct = readSoilMoisture();
  int batteryPct = readBatteryPct();
  int rssi = WiFi.RSSI();

  Serial.printf("Eau=%.1f%%  Pluie=%.1f mm/h  Sol=%.1f%%  Batt=%d%%\n",
                waterPct, rainfall, soilPct, batteryPct);

  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
    delay(2000);
  }
  if (WiFi.status() == WL_CONNECTED) {
    publish(waterPct, rainfall, soilPct, batteryPct, rssi);
  }
}

float readWaterLevel() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  long duration = pulseIn(PIN_ECHO, HIGH, 40000);
  if (duration == 0) return 0;
  float distance_cm = duration * 0.0343f / 2.0f;
  // distance courte = niveau haut
  float pct = (WATER_EMPTY_CM - distance_cm) / (WATER_EMPTY_CM - WATER_FULL_CM) * 100.0f;
  if (pct < 0) pct = 0;
  if (pct > 100) pct = 100;
  return pct;
}

float readRainfall() {
  // moyenne sur 5 lectures
  long sum = 0;
  for (int i = 0; i < 5; i++) {
    sum += analogRead(PIN_RAIN);
    delay(10);
  }
  int avg = sum / 5;
  // ADC élevé = sec, faible = trempé. On convertit en intensité 0–100 mm/h.
  float pct = (float)(RAIN_DRY - avg) / (float)(RAIN_DRY - RAIN_WET) * 100.0f;
  if (pct < 0) pct = 0;
  if (pct > 100) pct = 100;
  return pct;
}

float readSoilMoisture() {
  long sum = 0;
  for (int i = 0; i < 5; i++) {
    sum += analogRead(PIN_SOIL);
    delay(10);
  }
  int avg = sum / 5;
  float pct = (float)(SOIL_DRY - avg) / (float)(SOIL_DRY - SOIL_WET) * 100.0f;
  if (pct < 0) pct = 0;
  if (pct > 100) pct = 100;
  return pct;
}

int readBatteryPct() {
  int raw = analogRead(PIN_BATTERY);
  // diviseur 1:1, ADC 12-bit, alim 3.3V — Vbat ≈ raw * 3.3 * 2 / 4095
  float v = raw * 3.3f * 2.0f / 4095.0f;
  // mappage très approximatif Li-Ion 3.0–4.2V
  float pct = (v - 3.0f) / (4.2f - 3.0f) * 100.0f;
  if (pct < 0) pct = 0;
  if (pct > 100) pct = 100;
  return (int)pct;
}

void publish(float water, float rain, float soil, int batt, int rssi) {
  HTTPClient http;
  http.begin(INGEST_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", API_KEY);
  http.setTimeout(10000);

  StaticJsonDocument<384> doc;
  doc["deviceId"] = DEVICE_ID;
  JsonObject readings = doc.createNestedObject("readings");
  readings["water_level"] = round(water);
  readings["rainfall"] = round(rain);
  readings["soil_moisture"] = round(soil);
  doc["batteryLevel"] = batt;
  doc["signalStrength"] = rssi;

  String payload;
  serializeJson(doc, payload);
  int code = http.POST(payload);
  Serial.printf("[POST] %d %s\n", code, http.getString().c_str());
  http.end();
}
