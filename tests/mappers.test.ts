import { describe, expect, it } from 'vitest';

import type { TrackerType } from '@/core/domain';
import {
  mapCategory,
  mapDayEntry,
  mapTag,
  mapTracker,
  mapTrackerValue,
} from '@/core/repositories/prisma/mappers';

const now = new Date('2025-01-01T00:00:00Z');

describe('mapTracker', () => {
  it('mapea valores opcionales a undefined (no null)', () => {
    const t = mapTracker({
      id: 't1',
      userId: 'u1',
      name: 'Sueño',
      type: 'SCALE',
      unit: null,
      target: null,
      expectedPolarity: 'UNKNOWN',
      categoryId: null,
      order: 0,
      createdAt: now,
      archivedAt: null,
    });
    expect(t.unit).toBeUndefined();
    expect(t.target).toBeUndefined();
    expect(t.archivedAt).toBeUndefined();
    expect(t.type).toBe('SCALE');
  });

  it('preserva archivedAt si existe (soft-archive)', () => {
    const archived = new Date('2025-06-01T00:00:00Z');
    const t = mapTracker({
      id: 't1',
      userId: 'u1',
      name: 'Gym',
      type: 'CHECK',
      unit: null,
      target: null,
      expectedPolarity: 'POSITIVE',
      categoryId: 'c1',
      order: 3,
      createdAt: now,
      archivedAt: archived,
    });
    expect(t.archivedAt).toEqual(archived);
    expect(t.categoryId).toBe('c1');
    expect(t.expectedPolarity).toBe('POSITIVE');
  });
});

describe('mapTrackerValue (discriminated union por tipo)', () => {
  it('CHECK usa boolValue (sin calidad)', () => {
    const v = mapTrackerValue(
      { id: 'v1', dayEntryId: 'd1', trackerId: 't1', boolValue: true, numericValue: null, quality: null, createdAt: now },
      'CHECK',
    );
    expect(v).toEqual({ trackerId: 't1', kind: 'CHECK', done: true });
  });

  it('CHECK con calidad', () => {
    const v = mapTrackerValue(
      { id: 'v1', dayEntryId: 'd1', trackerId: 't1', boolValue: true, numericValue: null, quality: 4, createdAt: now },
      'CHECK',
    );
    expect(v).toEqual({ trackerId: 't1', kind: 'CHECK', done: true, quality: 4 });
  });

  it('SCALE usa numericValue', () => {
    const v = mapTrackerValue(
      { id: 'v1', dayEntryId: 'd1', trackerId: 't1', boolValue: null, numericValue: 7.5, quality: null, createdAt: now },
      'SCALE',
    );
    expect(v).toEqual({ trackerId: 't1', kind: 'SCALE', value: 7.5 });
  });

  it('COUNTER usa numericValue', () => {
    const v = mapTrackerValue(
      { id: 'v1', dayEntryId: 'd1', trackerId: 't1', boolValue: null, numericValue: 8, quality: null, createdAt: now },
      'COUNTER',
    );
    expect(v).toEqual({ trackerId: 't1', kind: 'COUNTER', value: 8 });
  });
});

describe('mapCategory / mapTag', () => {
  it('mapCategory', () => {
    const c = mapCategory({ id: 'c1', userId: 'u1', name: 'Salud', color: '#fff', order: 1 });
    expect(c).toEqual({ id: 'c1', name: 'Salud', color: '#fff', order: 1 });
  });

  it('mapTag color nullable -> undefined', () => {
    const t = mapTag({ id: 'tag1', userId: 'u1', name: 'viaje', color: null });
    expect(t.color).toBeUndefined();
  });
});

describe('mapDayEntry', () => {
  it('ignora valores cuyo tracker no esté en el mapa de tipos', () => {
    const types = new Map<string, TrackerType>([['t1', 'SCALE']]);
    const day = mapDayEntry(
      {
        id: 'd1',
        userId: 'u1',
        date: '2025-06-08',
        score: 7,
        note: null,
        predictedScore: null,
        createdAt: now,
        updatedAt: now,
        values: [
          { id: 'v1', dayEntryId: 'd1', trackerId: 't1', boolValue: null, numericValue: 5, quality: null, createdAt: now },
          { id: 'v2', dayEntryId: 'd1', trackerId: 't_ghost', boolValue: null, numericValue: 1, quality: null, createdAt: now },
        ],
        tags: [{ dayEntryId: 'd1', tagId: 'tag1' }],
      },
      types,
    );
    expect(day.values).toHaveLength(1);
    expect(day.values[0]).toMatchObject({ trackerId: 't1', kind: 'SCALE', value: 5 });
    expect(day.tagIds).toEqual(['tag1']);
    expect(day.score).toBe(7);
    expect(day.note).toBeUndefined();
  });
});
