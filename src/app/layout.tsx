import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { ThemeRegistry } from '@/theme/ThemeRegistry';

import './globals.css';

export const metadata: Metadata = {
  title: 'DayScore',
  description: 'Heatmap personal de días: puntuá, trackeá factores y descubrí patrones.',
};

export const viewport: Viewport = {
  themeColor: '#0a0b10',
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
