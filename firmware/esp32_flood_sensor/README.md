# Capteur ESP32 — Prévention inondations Douala

Module IoT autonome qui mesure niveau d'eau, pluviométrie et humidité du sol et envoie les lectures
à la Cloud Function `ingestSensorReading` toutes les 60 s. Une alerte publique est générée
automatiquement quand un seuil critique est franchi.

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
- `ArduinoJson` ≥ 6.21 (gestionnaire de bibliothèques)

## Configuration

1. Copier `config.h.example` en `config.h`.
2. Renseigner `WIFI_SSID`, `WIFI_PASSWORD`.
3. `INGEST_URL` : URL complète retournée par `firebase deploy --only functions`.
4. `API_KEY` : la même valeur que celle définie côté serveur via
   `firebase functions:secrets:set SENSOR_API_KEY`.
5. `DEVICE_ID` : doit correspondre exactement au champ `deviceId` du document
   `sensors/<id>` créé dans la console admin (ex. `ESP32-AKWA-001`).

## Flash & test

1. Brancher l'ESP32 en USB et sélectionner la carte « ESP32 Dev Module » dans l'IDE Arduino.
2. Vérifier puis téléverser le sketch `esp32_flood_sensor.ino`.
3. Ouvrir le moniteur série à 115200 baud — les lectures et le code HTTP de réponse s'affichent.

## Tests sans hardware

Vous pouvez simuler une remontée critique avec curl :

```bash
curl -X POST "$INGEST_URL" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
        "deviceId": "ESP32-AKWA-001",
        "readings": { "water_level": 85, "rainfall": 60, "soil_moisture": 92 },
        "batteryLevel": 87,
        "signalStrength": -65
      }'
```

Réponse attendue : `{ "ok": true, "alertLevel": "critical", "disasterId": "..." }` avec une
notification push reçue par les utilisateurs abonnés à la zone correspondante.

## Calibration

Les seuils ADC (`WATER_*`, `RAIN_*`, `SOIL_*`) varient selon les capteurs et le terrain.
Effectuer une calibration sur site :

- HC-SR04 : mesurer la distance entre le capteur et le fond du canal vide (`WATER_EMPTY_CM`)
  et le niveau maximum acceptable (`WATER_FULL_CM`).
- YL-83 : noter la valeur ADC à sec (sonde au sol) et trempée (5 mm de pluie simulée).
- Capacitif sol : valeur ADC dans l'air (sec) puis dans un seau d'eau (saturé).
