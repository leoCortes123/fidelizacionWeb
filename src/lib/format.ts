const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 0,
});

export function formatCOP(value: number): string {
  if (!Number.isFinite(value)) return '$ 0';
  return copFormatter.format(Math.round(value));
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return numberFormatter.format(value);
}

export function formatPoints(value: number): string {
  return `${formatNumber(value)} ${value === 1 ? 'punto' : 'puntos'}`;
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function parseCopInput(value: string): number | null {
  const digits = digitsOnly(value);
  if (!digits) return null;
  const parsed = Number(digits);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function formatCopInput(value: string): string {
  const digits = digitsOnly(value).replace(/^0+(?=\d)/, '');
  if (!digits) return '';
  return numberFormatter.format(Number(digits));
}

export function formatDateBogota(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTimeBogota(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatShortDateTimeBogota(
  value: string | null | undefined,
): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function pointsPreview(
  amountCop: number,
  copPerPointUnit: number,
  maxPoints: number,
): number {
  if (!Number.isFinite(amountCop) || amountCop <= 0) return 0;
  if (copPerPointUnit <= 0) return 0;
  return Math.min(Math.floor(amountCop / copPerPointUnit), maxPoints);
}

export function formatRedemptionCode(code: string): string {
  const clean = code.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  if (clean.length <= 4) return clean;
  return clean.match(/.{1,4}/g)?.join(' ') ?? clean;
}
