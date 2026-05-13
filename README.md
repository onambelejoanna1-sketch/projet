# Alerte Douala

Plateforme citoyenne de signalement et de suivi des catastrophes naturelles à Douala — inondations, glissements de terrain, incendies, tempêtes — couplée à un réseau de capteurs IoT ESP32 pour la prévention des inondations.

## Stack

- **Frontend** : Vite + React 19 (JSX, CSS Modules), React Router 7, Framer Motion, Leaflet + OpenStreetMap, date-fns. **PWA installable** (manifest + service worker via `vite-plugin-pwa`).
- **Backend** : Node.js + Express, base JSON (fichier `backend/data/db.json`), JWT + bcrypt, ingestion capteur via `x-api-key`.

## Installer l'application

L'application est une **PWA (Progressive Web App)** : elle peut être installée sur téléphone (iOS, Android) et ordinateur (Chrome, Edge, Safari, Firefox) pour être lancée comme une appli native, sans passer par le navigateur.

- **Desktop (Chrome / Edge)** : Cliquez sur l'icône « Installer » dans la barre d'adresse, ou ouvrez le menu `⋮ → Installer Alerte Douala`.
- **Android (Chrome)** : Bannière d'installation automatique, ou menu `⋮ → Ajouter à l'écran d'accueil`.
- **iOS (Safari)** : Touchez `Partager` ⬆︎ puis `« Sur l'écran d'accueil »`.

Une fois installée, l'app reste utilisable hors ligne (cache de l'app shell + dernières alertes API + tuiles de carte). Elle se met à jour automatiquement lors des nouvelles versions.

## Démarrer

```bash
# Frontend
npm install
npm run dev        # http://localhost:5173

# Backend (dans un autre terminal)
npm --prefix backend install
npm --prefix backend run dev   # http://localhost:4000

# Ou tout en un :
npm run dev:all
```

Vite proxifie automatiquement `/api/*` vers `http://localhost:4000`.

## Configuration

Aucune variable d'environnement n'est requise côté frontend.

Côté backend (`backend/.env`, voir `backend/.env.example`) :

```
PORT=4000
JWT_SECRET=change-me-please-use-a-long-random-string
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
CORS_ORIGIN=http://localhost:5173
SENSOR_API_KEY=change-me-shared-secret-with-firmware
```

## Comptes initiaux (seed)

Au premier démarrage, la base est amorcée avec :

| Email | Mot de passe | Rôle |
|---|---|---|
| `admin@test.com` | `12345678` | admin |
| `user@test.com` | `12345678` | user |

**Changez ces mots de passe** après le premier login en production.

Six capteurs IoT sont également préenregistrés (Akwa, Bonabéri, New Bell, Bépanda, Ndogpassi, Makepè).

## Ingestion capteur (ESP32)

Endpoint HTTP `POST /api/sensors/:deviceId/readings`, authentifié par header `x-api-key`.

Exemple PowerShell :

```powershell
$body = '{"deviceId":"ESP32-AKWA-001","readings":{"water_level":85,"rainfall":62,"soil_moisture":91},"batteryLevel":80}'
Invoke-RestMethod -Uri http://localhost:4000/api/sensors/ESP32-AKWA-001/readings `
  -Method POST -ContentType application/json `
  -Headers @{ 'x-api-key' = 'dev-sensor-key' } -Body $body
```

Si une lecture franchit un seuil critique, le backend crée automatiquement un disaster validé `source=sensor` et le diffuse à la home et à la console admin.

## Scripts

| Commande | Action |
|---|---|
| `npm run dev` | Dev server Vite (frontend) |
| `npm run dev:back` | Dev server Express (backend) |
| `npm run dev:all` | Lance frontend + backend en parallèle |
| `npm run build` | Build production dans `dist/` |
| `npm run preview` | Sert le build local sur `http://localhost:4173` (PWA activée — installable) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier sur `src/` |

## Architecture frontend

```
src/
├── assets/
├── components/
│   ├── common/         Button, Input, Card, Badge, Modal, Toast, Spinner, Container
│   ├── layout/         Header (+ Logo), Footer, DashboardLayout, ProtectedRoute
│   ├── home/           Hero, ProblemStats, HowItWorks, LiveTicker, LiveAlerts, MapPreview, Testimonials, CTAFinal
│   ├── disasters/      AlertCard, AlertFilters, SourceBadge, Tabs, RejectModal
│   ├── sensors/        SensorCard, SensorChart, SensorMapPin
│   └── map/            RiskMap, RiskLegend
├── pages/              Home, Auth, Report, Alerts, Map, Profile, Dashboard, Admin/*
├── routes/AppRoutes.jsx
├── services/
│   ├── api/            auth, users, disasters, sensors, admin, public
│   └── auth/           façade qui ré-exporte api
├── contexts/           AuthContext, ToastContext
├── hooks/              useAuth, useCamera
├── constants/          routes, disasterTypes, doualaZones, severityLevels, sensorTypes
├── utils/              dates, formatters, validators, geo, labels, image, riskZones
└── styles/             tokens, reset, typography, animations, globals
```

## Architecture backend

```
backend/
├── server.js
├── data/db.json                 (créée au premier démarrage)
└── src/
    ├── config/env.js
    ├── constants/domain.js      (DOUALA_ZONES, DISASTER_TYPES, SEVERITY_LEVELS)
    ├── db/{jsonStore, seed}.js
    ├── middleware/{auth, sensorAuth, errorHandler, notFound}.js
    ├── utils/{ids, errors, thresholds, publicUser}.js
    ├── validators/{auth, disasters}.validators.js
    ├── services/{auth, users, disasters, sensors, admin, public, activity}.service.js
    ├── controllers/{auth, users, disasters, sensors, admin, public}.controller.js
    └── routes/{auth, users, disasters, sensors, admin, public}.routes.js
```

## API en bref

| Méthode | Route | Auth |
|---|---|---|
| POST | `/api/auth/register` | – |
| POST | `/api/auth/login` | – |
| GET | `/api/auth/me` | JWT |
| POST | `/api/auth/logout` | JWT |
| GET/POST/PATCH/DELETE | `/api/users/*` | JWT (+ admin pour certaines) |
| GET/POST | `/api/disasters` | JWT |
| POST | `/api/disasters/:id/validate` | JWT admin |
| POST | `/api/disasters/:id/reject` | JWT admin |
| GET/POST/PATCH/DELETE | `/api/sensors/*` | JWT (+ admin pour mutation) |
| POST | `/api/sensors/:deviceId/readings` | `x-api-key` |
| GET | `/api/admin/{stats,activity,top-zones,alerts/buckets}` | JWT admin |
| GET | `/api/public/{feed,ticker,stats,sensors}` | – |

## Identité graphique

**Brutalisme éditorial tropical** — typographie Fraunces (titres) + Inter (corps) + JetBrains Mono (chiffres), palette papier crème / vert mangrove / terre cuite / rouge alerte. Bordures épaisses, ombres décalées, texture papier subtile. Voir `src/styles/tokens.css`.
