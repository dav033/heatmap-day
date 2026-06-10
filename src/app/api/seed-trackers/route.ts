import { NextResponse } from 'next/server';

import type { NewTrackerInput } from '@/core/repositories/interfaces';
import { trackerService } from '@/features/trackers';

export const dynamic = 'force-dynamic';

/**
 * Lista fija de trackers de prueba. La escala del dominio es siempre 0..10,
 * así que "escala 1-10" se mapea a SCALE sin configuración extra.
 */
const SEED_TRACKERS: NewTrackerInput[] = [
  { name: 'Gym', type: 'CHECK', expectedPolarity: 'POSITIVE' },
  { name: 'Hidratación', type: 'SCALE', expectedPolarity: 'POSITIVE' },
  { name: 'Socializar', type: 'SCALE', expectedPolarity: 'POSITIVE' },
  { name: 'Salir', type: 'CHECK', expectedPolarity: 'POSITIVE' },
  { name: 'Sobrepensar', type: 'SCALE', expectedPolarity: 'NEGATIVE' },
  { name: 'Alimentación', type: 'SCALE', expectedPolarity: 'POSITIVE' },
  { name: 'Dormir', type: 'SCALE', expectedPolarity: 'POSITIVE' },
  { name: 'Leer', type: 'CHECK', expectedPolarity: 'POSITIVE' },
  { name: 'Manga', type: 'CHECK', expectedPolarity: 'POSITIVE' },
  { name: 'Anime', type: 'CHECK', expectedPolarity: 'POSITIVE' },
  { name: 'Jugar', type: 'COUNTER', expectedPolarity: 'UNKNOWN' },
  { name: 'Imágenes', type: 'CHECK', expectedPolarity: 'POSITIVE' },
  { name: 'Trabajar [independiente]', type: 'CHECK', expectedPolarity: 'POSITIVE' },
  { name: 'Salud', type: 'SCALE', expectedPolarity: 'POSITIVE' },
  { name: 'Uso celular', type: 'SCALE', expectedPolarity: 'NEGATIVE' },
  { name: 'Música', type: 'SCALE', expectedPolarity: 'POSITIVE' },
  { name: 'Estado pelo', type: 'SCALE', expectedPolarity: 'POSITIVE' },
  { name: 'Cuarto hoy organizado', type: 'CHECK', expectedPolarity: 'POSITIVE' },
  { name: 'Estado habitación', type: 'SCALE', expectedPolarity: 'POSITIVE' },
  { name: 'Aseo', type: 'SCALE', expectedPolarity: 'POSITIVE' },
  { name: 'Acicalamiento', type: 'SCALE', expectedPolarity: 'POSITIVE' },
];

/**
 * POST /api/seed-trackers — crea los trackers de prueba predefinidos.
 * Idempotente: los nombres que ya existen (activos o archivados) se omiten.
 */
export async function POST(): Promise<NextResponse> {
  const existing = await trackerService.listTrackers({ includeArchived: true });
  const existingNames = new Set(existing.map((t) => t.name.trim().toLowerCase()));

  const created: string[] = [];
  const skipped: string[] = [];

  for (const input of SEED_TRACKERS) {
    if (existingNames.has(input.name.trim().toLowerCase())) {
      skipped.push(input.name);
      continue;
    }
    const tracker = await trackerService.createTracker(input);
    created.push(tracker.name);
  }

  return NextResponse.json({
    created,
    skipped,
    total: SEED_TRACKERS.length,
  });
}
