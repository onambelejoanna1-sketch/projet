import { DOUALA_BOUNDS } from '@/constants/doualaZones';

const EARTH_R_KM = 6371;

export function distanceKm(a, b) {
  if (!a || !b) return null;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_R_KM * Math.asin(Math.sqrt(h));
}

export function isInDouala({ lat, lng }) {
  return (
    lat >= DOUALA_BOUNDS.southWest.lat &&
    lat <= DOUALA_BOUNDS.northEast.lat &&
    lng >= DOUALA_BOUNDS.southWest.lng &&
    lng <= DOUALA_BOUNDS.northEast.lng
  );
}
