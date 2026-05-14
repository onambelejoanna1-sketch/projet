import { describe, expect, test } from 'vitest';
import {
  DEFAULT_THRESHOLDS,
  evaluateAlertLevel,
  isOffline,
  OFFLINE_AFTER_MS,
  severityFromAlertLevel,
} from './thresholds.js';

describe('evaluateAlertLevel', () => {
  test('retourne "normal" pour des lectures sous les seuils', () => {
    expect(
      evaluateAlertLevel({ water_level: 20, rainfall: 10, soil_moisture: 50 }),
    ).toBe('normal');
  });

  test('retourne "warning" si une lecture franchit le seuil warning', () => {
    expect(
      evaluateAlertLevel({ water_level: 65, rainfall: 10, soil_moisture: 50 }),
    ).toBe('warning');
  });

  test('retourne "critical" dès qu\'une lecture franchit le seuil critique', () => {
    expect(
      evaluateAlertLevel({ water_level: 85, rainfall: 10, soil_moisture: 50 }),
    ).toBe('critical');
  });

  test('"critical" prévaut sur "warning" même si plusieurs types croisent leurs seuils', () => {
    expect(
      evaluateAlertLevel({ water_level: 65, rainfall: 70, soil_moisture: 50 }),
    ).toBe('critical');
  });

  test('ignore les valeurs null/undefined', () => {
    expect(
      evaluateAlertLevel({ water_level: null, rainfall: 10, soil_moisture: 50 }),
    ).toBe('normal');
  });

  test('retourne "normal" pour readings null', () => {
    expect(evaluateAlertLevel(null)).toBe('normal');
  });

  test('valeur exactement égale au seuil compte comme franchie', () => {
    expect(
      evaluateAlertLevel({
        water_level: DEFAULT_THRESHOLDS.water_level.critical,
      }),
    ).toBe('critical');
    expect(
      evaluateAlertLevel({
        water_level: DEFAULT_THRESHOLDS.water_level.warning,
      }),
    ).toBe('warning');
  });
});

describe('isOffline', () => {
  test('true si lastSeenAtMs est null', () => {
    expect(isOffline(null)).toBe(true);
  });

  test('false si on a vu le capteur récemment', () => {
    const now = 1_000_000_000_000;
    expect(isOffline(now - 60_000, now)).toBe(false);
  });

  test('true si on a dépassé le seuil d\'offline', () => {
    const now = 1_000_000_000_000;
    expect(isOffline(now - OFFLINE_AFTER_MS - 1, now)).toBe(true);
  });
});

describe('severityFromAlertLevel', () => {
  test('mapping complet', () => {
    expect(severityFromAlertLevel('critical')).toBe('critical');
    expect(severityFromAlertLevel('warning')).toBe('medium');
    expect(severityFromAlertLevel('normal')).toBe('low');
    expect(severityFromAlertLevel('unknown')).toBe('low');
  });
});
