import { NextResponse } from 'next/server';

import { todayString } from '@/core/lib/date';
import { buildExportBundle } from '@/features/data-io';

export const dynamic = 'force-dynamic';

/**
 * GET /api/export — descarga todos los datos del usuario como JSON.
 */
export async function GET(): Promise<NextResponse> {
  const bundle = await buildExportBundle();
  return new NextResponse(JSON.stringify(bundle, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="dayscore-export-${todayString()}.json"`,
    },
  });
}
