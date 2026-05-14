import { makeError } from '../utils/errors.js';
import {
  DISASTER_TYPE_IDS,
  DOUALA_ZONE_IDS,
  SEVERITY_LEVELS,
} from '../constants/domain.js';

const PHOTO_DATAURL_RE = /^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=]+)$/;
const PHOTO_MAX_LEN = 700_000; // ~525 KB binary

const MAGIC = {
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  jpeg: [0xff, 0xd8, 0xff],
  webp: { riff: [0x52, 0x49, 0x46, 0x46], webp: [0x57, 0x45, 0x42, 0x50] },
};

function startsWith(buf, bytes) {
  if (buf.length < bytes.length) return false;
  for (let i = 0; i < bytes.length; i += 1) {
    if (buf[i] !== bytes[i]) return false;
  }
  return true;
}

function matchesDeclaredType(buf, declared) {
  if (declared === 'png') return startsWith(buf, MAGIC.png);
  if (declared === 'jpeg' || declared === 'jpg') return startsWith(buf, MAGIC.jpeg);
  if (declared === 'webp') {
    return (
      buf.length >= 12 &&
      startsWith(buf, MAGIC.webp.riff) &&
      MAGIC.webp.webp.every((b, i) => buf[8 + i] === b)
    );
  }
  return false;
}

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
  const match = PHOTO_DATAURL_RE.exec(photoDataUrl);
  if (!match) {
    throw makeError('disasters/invalid-photo', 'Format de photo invalide.');
  }
  const declared = match[1].toLowerCase();
  let head;
  try {
    head = Buffer.from(match[2].slice(0, 24), 'base64');
  } catch {
    throw makeError('disasters/invalid-photo', 'Image illisible.');
  }
  if (!matchesDeclaredType(head, declared)) {
    throw makeError('disasters/invalid-photo', 'En-tête image invalide ou incohérent.');
  }
}

export function validateRejectReason(reason) {
  const r = String(reason || '').trim();
  if (r.length < 3 || r.length > 200) {
    throw makeError('disasters/invalid-payload', 'Motif de rejet requis (3-200 caractères).');
  }
  return r;
}
