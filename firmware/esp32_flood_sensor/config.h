// Copier ce fichier en config.h et renseigner les valeurs ci-dessous.
// Ne PAS committer config.h (clés sensibles).

#pragma once

#define WIFI_SSID       "Infinity Box-989A73"
#define WIFI_PASSWORD   "KelianJ@2014"

// URL complète de l'endpoint d'ingestion du backend Express :
//   POST /api/sensors/:deviceId/readings
// En dev (ESP32 sur le même WiFi que la machine qui sert le backend) :
//   http:// 10.242.131.175:4000/api/sensors/ESP32-AKWA-001/readings
// En prod : utiliser HTTPS derrière un reverse proxy.
#define INGEST_URL      "http:// 192.168.1.146:4000/api/sensors/ESP32-AKWA-001/readings"

// Clé API partagée — doit correspondre exactement à SENSOR_API_KEY côté backend
// (variable d'environnement requise, voir backend/.env).
#define API_KEY         "dev-sensor-key"

// Identifiant unique du dispositif. Doit correspondre au champ deviceId
// d'un capteur enregistré côté backend (collection sensors).
#define DEVICE_ID       "ESP32-AKWA-001"
