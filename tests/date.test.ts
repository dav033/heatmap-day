import { describe, expect, it } from 'vitest';

import { enumerateDates, fromDateString, monthRange, toDateString, weekRange } from '@/core/lib/date';

describe('date helpers', () => {
  it('round-trip toDateString/fromDateString', () => {
    const d = new Date(2025, 5, 15); // 15 de junio
    const s = toDateString(d);
    expect(s).toBe('2025-06-15');
    const back = fromDateString(s);
    expect(back.getFullYear()).toBe(2025);
    expect(back.getMonth()).toBe(5);
    expect(back.getDate()).toBe(15);
  });

  it('weekRange cubre 7 días consecutivos', () => {
    const range = weekRange(new Date(2025, 5, 15));
    const days = enumerateDates(range);
    expect(days.length).toBe(7);
  });

  it('monthRange incluye 28-31 días según el mes', () => {
    const range = monthRange(new Date(2025, 1, 10)); // febrero 2025
    const days = enumerateDates(range);
    expect(days.length).toBe(28);
    expect(days[0]).toBe('2025-02-01');
    expect(days[days.length - 1]).toBe('2025-02-28');
  });
});
