import {
  addDays,
  addMonths,
  addYears,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';

/**
 * Las fechas de día se almacenan como `YYYY-MM-DD` (date-only) para evitar bugs
 * de zona horaria. Toda conversión Date <-> string pasa por estos helpers.
 */
export type DateString = string;

export function toDateString(d: Date): DateString {
  return format(d, 'yyyy-MM-dd');
}

export function fromDateString(s: DateString): Date {
  // parseISO interpreta YYYY-MM-DD como medianoche local, que es lo que queremos
  // para operaciones "date-only" sin desfase de zona horaria.
  return parseISO(s);
}

export function todayString(): DateString {
  return toDateString(new Date());
}

export interface DateRange {
  start: DateString;
  end: DateString;
}

// Semana inicia el lunes (Locale-friendly para casos comunes; ajustable en el futuro).
const WEEK_OPTS = { weekStartsOn: 1 } as const;

export function weekRange(from: Date): DateRange {
  return {
    start: toDateString(startOfWeek(from, WEEK_OPTS)),
    end: toDateString(endOfWeek(from, WEEK_OPTS)),
  };
}

export function monthRange(from: Date): DateRange {
  return { start: toDateString(startOfMonth(from)), end: toDateString(endOfMonth(from)) };
}

export function yearRange(from: Date): DateRange {
  return { start: toDateString(startOfYear(from)), end: toDateString(endOfYear(from)) };
}

export function shiftDays(date: Date, n: number): Date {
  return addDays(date, n);
}

export function shiftMonths(date: Date, n: number): Date {
  return addMonths(date, n);
}

export function shiftYears(date: Date, n: number): Date {
  return addYears(date, n);
}

export function enumerateDates(range: DateRange): DateString[] {
  const start = fromDateString(range.start);
  const end = fromDateString(range.end);
  const out: DateString[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    out.push(toDateString(d));
  }
  return out;
}
