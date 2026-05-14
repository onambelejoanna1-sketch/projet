# Capteur ESP32 — Prévention inondations Douala

Module IoT autonome qui mesure niveau d'eau, pluviométrie et humidité du sol et envoie les lectures
au backend Express (`POST /api/sensors/:deviceId/readings`) toutes les 60 s. Une alerte publique est
générée automatiquement quand un seuil critique est franchi (avec cooldown 30 min pour éviter les
doublons).

## Robustesse

Le firmware tourne 24/7 et embarque trois mécanismes pour ne pas se figer :

- **Watchdog logiciel (esp_task_wdt)** : si la boucle se bloque plus de 60 s, l'ESP32 reboot
  automatiquement.
- **Reconnexion WiFi non-bloquante** : tentatives espacées par backoff exponentiel (1 s → 60 s),
  sans `delay()` qui gèle la boucle.
- **Retry HTTP avec backoff** : si le backend renvoie 5xx ou un timeout, l'intervalle entre
  publications double (60 s → 5 min max), puis revient à 60 s dès la première réussite.

## Matériel requis

| Composant            | Modèle conseillé        | Pin ESP32       |
|----------------------|-------------------------|-----------------|
| Carte                | ESP32 DevKit V1         | —               |
| Capteur ultrason     | HC-SR04                 | TRIG=5, ECHO=18 |
| Capteur pluie        | YL-83 (carte + sonde)   | A0 → GPIO34     |
| Capteur humidité sol | Capacitif v2.0          | A1 → GPIO35     |
| Diviseur batterie    | 2× 100 kΩ vers Vbat     | GPIO33          |

Branchements alimentation :
- HC-SR04 : VCC=5V, GND=GND
- YL-83 : VCC=3V3, GND=GND
- Capacitif sol : VCC=3V3, GND=GND

## Bibliothèques Arduino

- `WiFi` (incluse avec le core ESP32)
- `HTTPClient` (incluse)
- `esp_task_wdt` (incluse avec le core ESP32)
- `ArduinoJson` ≥ 6.21 (gestionnaire de bibliothèques)

## Configuration

1. Copier `config.h.example` en `config.h`.
2. Renseigner `WIFI_SSID`, `WIFI_PASSWORD`.
3. `INGEST_URL` : URL complète de votre backend Express, par exemple
   `http://192.168.1.10:4000/api/sensors/ESP32-AKWA-001/readings`. En prod, utiliser HTTPS via un
   reverse proxy.
4. `API_KEY` : exactement la même valeur que `SENSOR_API_KEY` dans `backend/.env`.
5. `DEVICE_ID` : doit correspondre au champ `deviceId` d'un capteur enregistré côté backend
   (créé par seed ou via la console admin), ex. `ESP32-AKWA-001`.

## Flash & test

1. Brancher l'ESP32 en USB et sélectionner la carte « ESP32 Dev Module » dans l'IDE Arduino.
2. Vérifier puis téléverser le sketch `esp32_flood_sensor.ino`.
3. Ouvrir le moniteur série à 115200 baud — les lectures, le code HTTP de réponse et les
   messages `[WDT]` / `[WiFi]` / `[POST]` s'affichent.

## Tests sans hardware

Vous pouvez simuler une remontée critique avec PowerShell :

```powershell
$body = '{"deviceId":"ESP32-AKWA-001","readings":{"water_level":85,"rainfall":62,"soil_moisture":91},"batteryLevel":80}'
Invoke-RestMethod -Uri http://localhost:4000/api/sensors/ESP32-AKWA-001/readings `
  -Method POST -ContentType application/json `
  -Headers @{ 'x-api-key' = 'dev-sensor-key' } -Body $body
```

Réponse attendue : `{ "ok": true, "alertLevel": "critical", "disasterId": "..." }`. Une seconde
requête dans les 30 minutes renverra `disasterId: null` (cooldown anti-doublon).

## Calibration

Les seuils ADC (`WATER_*`, `RAIN_*`, `SOIL_*`) varient selon les capteurs et le terrain.
Effectuer une calibration sur site :

- HC-SR04 : mesurer la distance entre le capteur et le fond du canal vide (`WATER_EMPTY_CM`)
  et le niveau maximum acceptable (`WATER_FULL_CM`).
- YL-83 : noter la valeur ADC à sec (sonde au sol) et trempée (5 mm de pluie simulée).
- Capacitif sol : valeur ADC dans l'air (sec) puis dans un seau d'eau (saturé).
