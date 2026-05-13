// Constantes domaine côté backend.
// Doivent rester synchrones avec les constantes frontend
// (src/constants/disasterTypes.js, doualaZones.js, severityLevels.js).

export const DISASTER_TYPES = {
  flood: 'Inondation',
  landslide: 'Glissement de terrain',
  fire: 'Incendie',
  storm: 'Tempête',
  other: 'Autre',
};

export const DISASTER_TYPE_IDS = Object.keys(DISASTER_TYPES);

export const SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'];

export const DISASTER_STATUSES = ['pending', 'validated', 'rejected'];

export const DOUALA_ZONES = [
  { id: 'akwa', name: 'Akwa', arrondissement: 'Douala 1er', lat: 4.0469, lng: 9.7034 },
  { id: 'bonanjo', name: 'Bonanjo', arrondissement: 'Douala 1er', lat: 4.0466, lng: 9.6921 },
  { id: 'deido', name: 'Deïdo', arrondissement: 'Douala 1er', lat: 4.0625, lng: 9.7055 },
  { id: 'bonaberi', name: 'Bonabéri', arrondissement: 'Douala 4e', lat: 4.0822, lng: 9.6622 },
  { id: 'new-bell', name: 'New Bell', arrondissement: 'Douala 2e', lat: 4.0426, lng: 9.7244 },
  { id: 'ndogpassi', name: 'Ndogpassi', arrondissement: 'Douala 3e', lat: 4.075, lng: 9.78 },
  { id: 'logbessou', name: 'Logbessou', arrondissement: 'Douala 5e', lat: 4.083, lng: 9.79 },
  { id: 'pk', name: 'PK Axe Lourd', arrondissement: 'Douala 3e', lat: 4.099, lng: 9.81 },
  { id: 'makepe', name: 'Makepè', arrondissement: 'Douala 5e', lat: 4.0717, lng: 9.7531 },
  { id: 'bonamoussadi', name: 'Bonamoussadi', arrondissement: 'Douala 5e', lat: 4.085, lng: 9.755 },
  { id: 'bepanda', name: 'Bépanda', arrondissement: 'Douala 5e', lat: 4.07, lng: 9.74 },
  { id: 'village', name: 'Village', arrondissement: 'Douala 1er', lat: 4.06, lng: 9.69 },
];

export const DOUALA_ZONE_IDS = DOUALA_ZONES.map((z) => z.id);

const ZONE_BY_ID = Object.fromEntries(DOUALA_ZONES.map((z) => [z.id, z]));

export function zoneById(id) {
  return ZONE_BY_ID[id] || null;
}
