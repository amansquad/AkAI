import { describe, expect, it } from 'vitest';
import { deviceOf, isClean, validate } from './community-themes';

const colors = { bg: '#000000', key: '#111111', special: '#222222', accent: '#ff0000', text: '#ffffff' };

describe('isClean', () => {
  it('passes ordinary names', () => {
    expect(isClean('Addis Sunset')).toBe(true);
    expect(isClean('ሰላም')).toBe(true);
  });
  it('catches look-alike spellings', () => {
    expect(isClean('Sh1t')).toBe(false);
    expect(isClean('f.u.c.k')).toBe(false);
    expect(isClean('F U C K')).toBe(false);
  });
});

describe('validate', () => {
  it('accepts a good theme and upper-cases its colours', () => {
    const r = validate({ name: '  Night  ', emoji: '🌙', live: 'aurora', colors });
    expect('theme' in r && r.theme.colors.accent).toBe('#FF0000');
    expect('theme' in r && r.theme.name).toBe('Night');
  });
  it('rejects bad names, emoji, animations and colours', () => {
    expect(validate({ name: '', emoji: '🌙', colors })).toHaveProperty('error');
    expect(validate({ name: 'x'.repeat(25), emoji: '🌙', colors })).toHaveProperty('error');
    expect(validate({ name: 'Ok', emoji: 'A', colors })).toHaveProperty('error');
    expect(validate({ name: 'Ok', emoji: '🌙', live: '../x', colors })).toHaveProperty('error');
    expect(validate({ name: 'Ok', emoji: '🌙', colors: { ...colors, bg: 'red' } })).toHaveProperty('error');
  });
  it('accepts the new live scene names', () => {
    expect(validate({ name: 'Deep', emoji: '🦑', live: 'deep_sea_live', colors })).toHaveProperty('theme');
  });
});

describe('deviceOf', () => {
  it('hashes a well-formed id and refuses a malformed one', () => {
    const ok = deviceOf(new Request('https://x.test', { headers: { 'x-akai-device': 'f174fcdb-1611-4150-b797-2a73498dec5b' } }));
    expect(ok).toMatch(/^[0-9a-f]{64}$/);
    expect(deviceOf(new Request('https://x.test', { headers: { 'x-akai-device': 'bad id!' } }))).toBeNull();
  });
});
