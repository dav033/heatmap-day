/**
 * Resultado tipo discriminado para representar éxito/error sin throws.
 * Útil sobre todo en application/services y bordes (API/Server Actions).
 */
export type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
