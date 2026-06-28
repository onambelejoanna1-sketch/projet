/*
 * Alerte Douala — Capteur ESP32 anti-inondation
 *
 * Mesure 3 paramètres (niveau d'eau, pluviométrie, humidité du sol) et envoie les lectures
 * au backend Express toutes les 60 s (POST /api/sensors/:deviceId/readings).
 *
 * Capteurs :
 *   - Niveau d'eau   : HC-SR04 (ultrason) — TRIG=GPIO5, ECHO=GPIO18
 *   - Pluviométrie   : YL-83 (analogique) — A0 sur GPIO34
 *   - Humidité sol   : capacitif v2.0    — A1 sur GPIO35
 *
 * Robustesse :
 *   - Watchdog logiciel (esp_task_wdt) qui reboot l'ESP32 si la boucle se fige.
 *   - Reconnexion WiFi non-bloquante avec backoff exponentiel (1s → 60s).
 *   - Retry sur 5xx / timeout du backend avec backoff (60s → 5 min entre publications).
 *
 * Configuration : copier config.h.example en config.h et renseigner WiFi + URL + clé API.
 */
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <esp_task_wdt.h>
#include "config.h"

// --- Pins ---
constexpr int PIN_TRIG = 5;
constexpr int PIN_ECHO = 18;
constexpr int PIN_RAIN = 34;     // ADC1_CH6
constexpr int PIN_SOIL = 35;     // ADC1_CH7
constexpr int PIN_BATTERY = 33;  // diviseur de tension batterie

// --- Calibration ---
constexpr float WATER_FULL_CM = 5.0;   // capteur sous l'eau au max → 5 cm (Seau Plein = 10L)
constexpr float WATER_EMPTY_CM = 200.0; // capteur loin de l'eau → 200 cm (Seau Vide = 0L)
constexpr int RAIN_DRY = 4095;          // ADC sec
constexpr int RAIN_WET = 1500;          // ADC trempé
constexpr int SOIL_DRY = 3500;          // ADC sol sec
constexpr int SOIL_WET = 1200;          // ADC sol détrempé

// --- Paramètres de la cuve/seau ---
constexpr float MAX_VOLUME_LITERS = 10.0;    // Capacité totale du seau (10L)
constexpr float ALERT_THRESHOLD_LITERS = 8.0; // Seuil de déclenchement automatique de l'alerte (8L)

// --- Robustesse ---
constexpr uint32_t WDT_TIMEOUT_S = 60;
constexpr unsigned long PUBLISH_INTERVAL_MS = 60UL * 1000UL;
constexpr unsigned long MAX_PUBLISH_BACKOFF_MS = 5UL * 60UL * 1000UL;
constexpr unsigned long WIFI_RECONNECT_INITIAL_MS = 1000UL;
constexpr unsigned long WIFI_RECONNECT_MAX_MS = 60UL * 1000UL;

unsigned long lastPublish = 0;
unsigned long currentPublishDelay = PUBLISH_INTERVAL_MS;
unsigned long lastWifiAttempt = 0;
unsigned long wifiBackoffMs = WIFI_RECONNECT_INITIAL_MS;
int consecutiveFailures = 0;

// État de l'alerte pour éviter le spam si l'alerte a déjà été envoyée immédiatement
bool alertActive = false; 

void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  analogReadResolution(12);

  Serial.printf("Connexion WiFi à %s...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 30000) {
    delay(500);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WiFi] OK — IP %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n[WiFi] Échec au démarrage — on retente dans la boucle.");
  }

#if defined(ESP_ARDUINO_VERSION_MAJOR) && ESP_ARDUINO_VERSION_MAJOR >= 3
  esp_task_wdt_config_t wdtCfg = {
    .timeout_ms = WDT_TIMEOUT_S * 1000U,
    .idle_core_mask = 0,
    .trigger_panic = true,
  };
  esp_task_wdt_init(&wdtCfg);
#else
  esp_task_wdt_init(WDT_TIMEOUT_S, true);
#endif
  esp_task_wdt_add(NULL);
  Serial.printf("[WDT] activé (%lus)\n", (unsigned long)WDT_TIMEOUT_S);
}

void loop() {
  esp_task_wdt_reset();
  unsigned long now = millis();

  // 1) WiFi : reconnexion non-bloquante
  if (WiFi.status() != WL_CONNECTED) {
    if (lastWifiAttempt == 0 || now - lastWifiAttempt >= wifiBackoffMs) {
      Serial.printf("[WiFi] reconnexion (backoff %lu ms)\n", wifiBackoffMs);
      WiFi.disconnect();
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
      lastWifiAttempt = now;
      unsigned long next = wifiBackoffMs * 2;
      wifiBackoffMs = next > WIFI_RECONNECT_MAX_MS ? WIFI_RECONNECT_MAX_MS : next;
    }
    delay(200);
    return;
  }
  wifiBackoffMs = WIFI_RECONNECT_INITIAL_MS;
  lastWifiAttempt = 0;

  // 2) Lectures préalables du niveau d'eau pour tester le seuil d'inondation
  float waterPct = readWaterLevel();
  float volumeLiters = (waterPct / 100.0f) * MAX_VOLUME_LITERS;
  
  // Détermination de l'état d'alerte (Dès 8L)
  bool shouldAlert = (volumeLiters >= ALERT_THRESHOLD_LITERS);

  // Déclenchement automatique : Si une inondation est détectée et qu'on n'était pas déjà en alerte, 
  // on force la publication immédiate sans attendre l'intervalle des 60s.
  bool forcePublish = (shouldAlert && !alertActive);

  // 3) Cadence d'envoi (court-circuitée si forcePublish est vrai)
  if (!forcePublish && lastPublish != 0 && now - lastPublish < currentPublishDelay) {
    delay(200);
    return;
  }
  
  // Mise à jour de l'état de l'alerte
  alertActive = shouldAlert;
  lastPublish = now;

  // 4) Lectures des autres capteurs
  float rainfall = readRainfall();
  float soilPct = readSoilMoisture();
  int batteryPct = readBatteryPct();
  int rssi = WiFi.RSSI();

  if (alertActive) {
    Serial.println("!!! [ALERTE INONDATION] SEUIL DES 8L ATTEINT !!!");
  }
  Serial.printf("Eau=%.1f%% (%.2fL)  Pluie=%.1f mm/h  Sol=%.1f%%  Batt=%d%%\n",
                waterPct, volumeLiters, rainfall, soilPct, batteryPct);

  // 5) Publication + gestion d'échec
  bool ok = publish(waterPct, volumeLiters, rainfall, soilPct, batteryPct, rssi, alertActive);
  if (ok) {
    consecutiveFailures = 0;
    currentPublishDelay = PUBLISH_INTERVAL_MS;
  } else {
    if (consecutiveFailures < 8) consecutiveFailures++;
    int shift = consecutiveFailures > 3 ? 3 : consecutiveFailures;
    unsigned long backoff = PUBLISH_INTERVAL_MS * (1UL << shift);
    currentPublishDelay = backoff > MAX_PUBLISH_BACKOFF_MS ? MAX_PUBLISH_BACKOFF_MS : backoff;
    Serial.printf("[POST] échec #%d — prochain envoi dans %lu ms\n",
                  consecutiveFailures, currentPublishDelay);
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
  
  float pct = (WATER_EMPTY_CM - distance_cm) / (WATER_EMPTY_CM - WATER_FULL_CM) * 100.0f;
  if (pct < 0) pct = 0;
  if (pct > 100) pct = 100;
  return pct;
}

float readRainfall() {
  long sum = 0;
  for (int i = 0; i < 5; i++) {
    sum += analogRead(PIN_RAIN);
    delay(10);
  }
  int avg = sum / 5;
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
  float v = raw * 3.3f * 2.0f / 4095.0f;
  float pct = (v - 3.0f) / (4.2f - 3.0f) * 100.0f;
  if (pct < 0) pct = 0;
  if (pct > 100) pct = 100;
  return (int)pct;
}

// Nouvelle signature prenant en compte le volume en litres et le statut d'alerte
bool publish(float water, float volume, float rain, float soil, int batt, int rssi, bool alert) {
  HTTPClient http;
  http.begin(INGEST_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", API_KEY);
  http.setTimeout(10000);

  // Taille augmentée légèrement pour accueillir les nouvelles clés du JSON
  StaticJsonDocument<512> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["alert"] = alert; // True si >= 8 Litres, sinon False
  
  JsonObject readings = doc.createNestedObject("readings");
  readings["water_level_pct"] = round(water);
  readings["water_volume_liters"] = round(volume * 10.0f) / 10.0f; // Arrondi à 1 décimale
  readings["rainfall"] = round(rain);
  readings["soil_moisture"] = round(soil);
  
  doc["batteryLevel"] = batt;
  doc["signalStrength"] = rssi;

  String payload;
  serializeJson(doc, payload);
  int code = http.POST(payload);
  
  Serial.printf("[POST] code=%d\n", code);
  http.end();
  return code >= 200 && code < 300;
}