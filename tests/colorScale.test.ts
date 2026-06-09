import { describe, expect, it } from 'vitest';

import { COLOR_EMPTY, scoreToColor } from '@/core/lib/colorScale';

describe('scoreToColor', () => {
  it('devuelve color neutro para puntaje ausente', () => {
    expect(scoreToColor(null)).toBe(COLOR_EMPTY);
    expect(scoreToColor(undefined)).toBe(COLOR_EMPTY);
    expect(scoreToColor(Number.NaN)).toBe(COLOR_EMPTY);
  });

  it('produce un color hex válido para extremos y medio', () => {
    for (const s of [0, 5, 10]) {
      const c = scoreToColor(s);
      expect(c).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('clampea valores fuera de rango', () => {
    expect(scoreToColor(-5)).toBe(scoreToColor(0));
    expect(scoreToColor(15)).toBe(scoreToColor(10));
  });

  it('cambia el color conforme aumenta el puntaje (gradiente monótono no constante)', () => {
    const colors = [0, 2, 4, 6, 8, 10].map((s) => scoreToColor(s));
    const unique = new Set(colors);
    expect(unique.size).toBeGreaterThan(3);
  });
});
