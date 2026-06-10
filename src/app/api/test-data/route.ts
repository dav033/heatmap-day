import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createTestRecord, insertTestDay, insertTestWeek } from '@/features/test-data';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  action: z.enum(['record', 'day', 'week']),
  quality: z.enum(['bad', 'medium', 'good']),
  /** Opcional: con la misma semilla el resultado es reproducible. */
  seed: z.number().int().nonnegative().optional(),
});

/**
 * POST /api/test-data — genera datos de prueba pseudoaleatorios.
 * - `record`: BORRA todo el historial de días y crea un mes completo
 *   (malo: media < 6 · medio: 6–8 · bueno: > 8).
 * - `day` / `week`: insertan en fechas libres, sin tocar lo existente.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Body inválido', details: parsed.error.issues },
      { status: 400 },
    );
  }
  const { action, quality, seed } = parsed.data;

  try {
    const result =
      action === 'record'
        ? await createTestRecord(quality, seed)
        : action === 'day'
          ? await insertTestDay(quality, seed)
          : await insertTestWeek(quality, seed);
    return NextResponse.json({ action, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error generando datos de prueba';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
