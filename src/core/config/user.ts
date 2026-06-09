import { prisma } from '@/core/db/prisma';

// Punto único a tocar para multiusuario. Mientras tanto, devuelve el usuario local por defecto.
const DEFAULT_USER_NAME = 'local';

let cachedUserId: string | null = null;

export async function getCurrentUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;
  const user = await prisma.user.findFirst({ where: { name: DEFAULT_USER_NAME } });
  if (!user) {
    throw new Error(
      'No existe el usuario por defecto. Corré `npm run db:seed` para inicializarlo.',
    );
  }
  cachedUserId = user.id;
  return user.id;
}
