import { describe, expect, test } from 'vitest';
import {
  normalizeEmail,
  validateDisplayName,
  validateEmail,
  validatePassword,
} from './auth.validators.js';

describe('normalizeEmail', () => {
  test('passe en minuscules et retire les espaces', () => {
    expect(normalizeEmail('  Admin@Test.COM ')).toBe('admin@test.com');
  });

  test('renvoie une chaîne vide pour les valeurs vides', () => {
    expect(normalizeEmail(null)).toBe('');
    expect(normalizeEmail(undefined)).toBe('');
    expect(normalizeEmail('')).toBe('');
  });
});

describe('validateEmail', () => {
  test.each([
    'admin@test.com',
    'a@b.co',
    'me@sub.example.co.uk',
    '  whitespaced@example.fr  ',
  ])('accepte %s', (email) => {
    expect(() => validateEmail(email)).not.toThrow();
  });

  test.each([
    ['a@b.c', 'TLD trop courte'],
    ['noatsign.example.com', 'pas de @'],
    ['test@@example.com', 'double @'],
    ['.test@example.com', 'point initial'],
    ['', 'chaîne vide'],
  ])('rejette %s (%s)', (email) => {
    expect(() => validateEmail(email)).toThrow(/Email invalide/);
  });
});

describe('validatePassword', () => {
  test('accepte 8 caractères ou plus', () => {
    expect(validatePassword('12345678')).toBe('12345678');
  });

  test('rejette moins de 8 caractères', () => {
    expect(() => validatePassword('1234567')).toThrow(/au moins 8/);
  });

  test('rejette les non-strings', () => {
    expect(() => validatePassword(12345678)).toThrow(/au moins 8/);
    expect(() => validatePassword(undefined)).toThrow();
  });
});

describe('validateDisplayName', () => {
  test('trim + accepte 2 à 60 caractères', () => {
    expect(validateDisplayName('  Marie  ')).toBe('Marie');
    expect(validateDisplayName('a'.repeat(60))).toBe('a'.repeat(60));
  });

  test('rejette trop court ou trop long', () => {
    expect(() => validateDisplayName('M')).toThrow(/entre 2 et 60/);
    expect(() => validateDisplayName('a'.repeat(61))).toThrow(/entre 2 et 60/);
  });
});
