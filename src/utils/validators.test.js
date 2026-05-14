import { describe, expect, test } from 'vitest';
import { isEmail, isStrongPassword, isNonEmpty } from './validators';

describe('isEmail', () => {
  test.each([
    ['admin@test.com'],
    ['user@test.com'],
    ['a@b.co'],
    ['me@sub.example.co.uk'],
    ['  whitespaced@example.fr  '],
  ])('accepte %s', (value) => {
    expect(isEmail(value)).toBe(true);
  });

  test.each([
    ['a@b.c', 'TLD trop courte'],
    ['noatsign.example.com', 'pas de @'],
    ['test@@example.com', 'double @'],
    ['.test@example.com', 'point initial'],
    ['test.@example.com', 'point final dans la partie locale'],
    ['test@example.', 'point final dans le domaine'],
    ['', 'chaîne vide'],
    ['  ', 'que des espaces'],
  ])('rejette %s (%s)', (value) => {
    expect(isEmail(value)).toBe(false);
  });
});

describe('isStrongPassword', () => {
  test('accepte 8 caractères ou plus', () => {
    expect(isStrongPassword('12345678')).toBe(true);
    expect(isStrongPassword('abcdefghij')).toBe(true);
  });

  test('rejette moins de 8 caractères', () => {
    expect(isStrongPassword('1234567')).toBe(false);
    expect(isStrongPassword('')).toBe(false);
  });

  test('rejette les non-strings', () => {
    expect(isStrongPassword(undefined)).toBe(false);
    expect(isStrongPassword(null)).toBe(false);
    expect(isStrongPassword(12345678)).toBe(false);
  });
});

describe('isNonEmpty', () => {
  test('accepte une chaîne avec du contenu', () => {
    expect(isNonEmpty('coucou')).toBe(true);
    expect(isNonEmpty('  a  ')).toBe(true);
  });

  test('rejette les chaînes vides ou non-strings', () => {
    expect(isNonEmpty('')).toBe(false);
    expect(isNonEmpty('   ')).toBe(false);
    expect(isNonEmpty(null)).toBe(false);
    expect(isNonEmpty(undefined)).toBe(false);
    expect(isNonEmpty(42)).toBe(false);
  });
});
