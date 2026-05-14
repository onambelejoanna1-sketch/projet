import { describe, expect, test } from 'vitest';
import {
  validateNewDisaster,
  validatePhotoDataUrl,
  validateRejectReason,
} from './disasters.validators.js';

// PNG 1×1 transparent — magic bytes valides : 89 50 4E 47 0D 0A 1A 0A
const REAL_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const FAKE_PNG_BYTES = 'data:image/png;base64,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

const REAL_JPEG = `data:image/jpeg;base64,${Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]).toString('base64')}`;

describe('validatePhotoDataUrl', () => {
  test('accepte un PNG avec magic bytes corrects', () => {
    expect(() => validatePhotoDataUrl(REAL_PNG)).not.toThrow();
  });

  test('accepte un JPEG avec magic bytes corrects', () => {
    expect(() => validatePhotoDataUrl(REAL_JPEG)).not.toThrow();
  });

  test('rejette un faux PNG (bytes nuls)', () => {
    expect(() => validatePhotoDataUrl(FAKE_PNG_BYTES)).toThrow(/En-tête image invalide/);
  });

  test('rejette une chaîne qui ne ressemble pas à une data URL image', () => {
    expect(() => validatePhotoDataUrl('plain text')).toThrow(/Format de photo invalide/);
  });

  test('rejette une chaîne vide', () => {
    expect(() => validatePhotoDataUrl('')).toThrow(/obligatoire/);
  });

  test('rejette une chaîne null', () => {
    expect(() => validatePhotoDataUrl(null)).toThrow(/obligatoire/);
  });

  test('rejette les photos trop volumineuses', () => {
    const huge = `data:image/png;base64,${'A'.repeat(700_001)}`;
    expect(() => validatePhotoDataUrl(huge)).toThrow(/trop volumineuse/);
  });
});

describe('validateNewDisaster', () => {
  const basePayload = {
    type: 'flood',
    quartierId: 'akwa',
    severity: 'medium',
    title: 'Inondation rue principale',
    description: 'Eau monte rapidement, environ 30 cm dans la rue.',
    address: 'Rue 12',
    photoDataUrl: REAL_PNG,
  };

  test('accepte un payload complet et valide', () => {
    const result = validateNewDisaster(basePayload);
    expect(result.type).toBe('flood');
    expect(result.severity).toBe('medium');
  });

  test('rejette un type inconnu', () => {
    expect(() => validateNewDisaster({ ...basePayload, type: 'tornado' })).toThrow(
      /Type de catastrophe invalide/,
    );
  });

  test('rejette une zone inconnue', () => {
    expect(() => validateNewDisaster({ ...basePayload, quartierId: 'mars' })).toThrow(
      /Zone invalide/,
    );
  });

  test('rejette un titre trop court', () => {
    expect(() => validateNewDisaster({ ...basePayload, title: 'Ko' })).toThrow(
      /Titre invalide/,
    );
  });

  test('rejette une description trop courte', () => {
    expect(() => validateNewDisaster({ ...basePayload, description: 'trop' })).toThrow(
      /Description invalide/,
    );
  });
});

describe('validateRejectReason', () => {
  test('accepte un motif entre 3 et 200 caractères', () => {
    expect(validateRejectReason('Pas pertinent')).toBe('Pas pertinent');
  });

  test('rejette un motif trop court', () => {
    expect(() => validateRejectReason('no')).toThrow(/Motif de rejet/);
  });

  test('rejette un motif trop long', () => {
    expect(() => validateRejectReason('a'.repeat(201))).toThrow(/Motif de rejet/);
  });
});
