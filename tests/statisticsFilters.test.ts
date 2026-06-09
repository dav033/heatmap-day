import { describe, expect, it } from 'vitest';

import {
  filterValuesByWindow,
  type DatedValue,
  type TrackerWindow,
} from '@/core/domain';

const v = (date: string, value: number): DatedValue => ({
  date,
  value: { trackerId: 't1', kind: 'SCALE', value },
});

describe('filterValuesByWindow (regla §6.1 "no registrado ≠ 0")', () => {
  it('excluye valores anteriores al createdAt del tracker', () => {
    const window: TrackerWindow = {
      trackerId: 't1',
      createdAt: new Date('2025-02-01T00:00:00'),
    };
    const out = filterValuesByWindow([v('2025-01-15', 5), v('2025-02-01', 7)], window);
    expect(out.map((x) => x.date)).toEqual(['2025-02-01']);
  });

  it('excluye valores posteriores al archivedAt si está archivado', () => {
    const window: TrackerWindow = {
      trackerId: 't1',
      createdAt: new Date('2025-01-01T00:00:00'),
      archivedAt: new Date('2025-06-30T00:00:00'),
    };
    const out = filterValuesByWindow(
      [v('2025-05-10', 6), v('2025-07-15', 8)],
      window,
    );
    expect(out.map((x) => x.date)).toEqual(['2025-05-10']);
  });

  it('no inventa días — entrada vacía -> salida vacía', () => {
    const window: TrackerWindow = { trackerId: 't1', createdAt: new Date('2025-01-01') };
    expect(filterValuesByWindow([], window)).toEqual([]);
  });

  it('mantiene todos los valores cuando están dentro de la ventana', () => {
    const window: TrackerWindow = { trackerId: 't1', createdAt: new Date('2025-01-01') };
    const out = filterValuesByWindow([v('2025-01-01', 1), v('2025-12-31', 10)], window);
    expect(out).toHaveLength(2);
  });
});
