import type { MetadataRoute } from 'next';

/**
 * Manifest PWA-ready (sin service worker todavía — ver fase 7 del plan).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DayScore',
    short_name: 'DayScore',
    description:
      'Heatmap personal de días: puntuá, trackeá factores y descubrí patrones.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0b10',
    theme_color: '#0a0b10',
    icons: [{ src: '/favicon.ico', sizes: 'any' }],
  };
}
