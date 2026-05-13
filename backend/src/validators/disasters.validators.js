import { makeError } from '../utils/errors.js';
import {
  DISASTER_TYPE_IDS,
  DOUALA_ZONE_IDS,
  SEVERITY_LEVELS,
} from '../constants/domain.js';

const PHOTO_DATAURL_RE = /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/;
const PHOTO_MAX_LEN = 700_000; // ~525 KB binary

export function validateNewDisaster(input) {
  if (!input || typeof input !== 'object') {
    throw makeError('disasters/invalid-payload', 'Payload de signalement invalide.');
  }
  const { type, quartierId, severity, title, description, address, photoDataUrl } = input;

  if (!DISASTER_TYPE_IDS.includes(type)) {
    throw makeError('disasters/invalid-payload', 'Type de catastrophe invalide.');
  }
  if (!DOUALA_ZONE_IDS.includes(quartierId)) {
    throw makeError('disasters/invalid-payload', 'Zone invalide.');
  }
  if (!SEVERITY_LEVELS.includes(severity)) {
    throw makeError('disasters/invalid-payload', 'Sévérité invalide.');
  }
  const t = String(title || '').trim();
  if (t.length < 4 || t.length > 80) {
    throw makeError('disasters/invalid-payload', 'Titre invalide (4-80 caractères).');
  }
  const d = String(description || '').trim();
  if (d.length < 10 || d.length > 500) {
    throw makeError('disasters/invalid-payload', 'Description invalide (10-500 caractères).');
  }
  const a = address == null ? null : String(address).trim().slice(0, 200) || null;

  validatePhotoDataUrl(photoDataUrl);

  return {
    type,
    quartierId,
    severity,
    title: t,
    description: d,
    address: a,
    photoDataUrl,
  };
}

export function validatePhotoDataUrl(photoDataUrl) {
  if (typeof photoDataUrl !== 'string' || !photoDataUrl) {
    throw makeError('disasters/invalid-photo', 'Photo obligatoire.');
  }
  if (photoDataUrl.length > PHOTO_MAX_LEN) {
    throw makeError('disasters/photo-too-large', 'Photo trop volumineuse (max ~500 KB).');
  }
  if (!PHOTO_DATAURL_RE.test(photoDataUrl)) {
    throw makeError('disasters/invalid-photo', 'Format de photo invalide.');
  }
}

export function validateRejectReason(reason) {
  const r = String(reason || '').trim();
  if (r.length < 3 || r.length > 200) {
    throw makeError('disasters/invalid-payload', 'Motif de rejet requis (3-200 caractères).');
  }
  return r;
}
