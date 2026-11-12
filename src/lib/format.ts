import { loopointWord } from "./copy";

const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});

export function formatCOP(value: number): string {
  if (!Number.isFinite(value)) return "$ 0";
  return copFormatter.format(Math.round(value));
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return numberFormatter.format(value);
}

export function formatLoopoints(value: number): string {
  return `${formatNumber(value)} ${loopointWord(value)}`;
}

/** @deprecated Usa `formatLoopoints`; se conserva para imports antiguos. */
export const formatPoints = formatLoopoints;

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function parseCopInput(value: string): number | null {
  const digits = digitsOnly(value);
  if (!digits) return null;
  const parsed = Number(digits);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function formatCopInput(value: string): string {
  const digits = digitsOnly(value).replace(/^0+(?=\d)/, "");
  if (!digits) return "";
  return numberFormatter.format(Number(digits));
}

export function formatDateBogota(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTimeBogota(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatShortDateTimeBogota(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
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
  const clean = code.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  if (clean.length <= 4) return clean;
  return clean.match(/.{1,4}/g)?.join(" ") ?? clean;
}

const THOUSANDS_DOT_PATTERN = /^\d{1,3}(\.\d{3})+$/;

/**
 * Interpreta entradas numéricas en formato es-CO (acepta separadores de miles
 * con punto para COP/enteros y coma o punto decimal para porcentajes).
 */
export function parseEconomicNumber(
  value: string,
  kind: "cop" | "integer" | "percent" = "percent",
): number | null {
  const cleaned = value.trim().replace(/\s/g, "");
  if (!cleaned) return null;

  if (kind === "cop" || kind === "integer") {
    const unsigned = cleaned.startsWith("-") ? cleaned.slice(1) : cleaned;
    if (unsigned.includes(",")) {
      const normalizedDecimal = cleaned.replace(",", ".");
      const decimalParsed = Number(normalizedDecimal);
      if (!Number.isFinite(decimalParsed) || Number.isInteger(decimalParsed)) {
        return null;
      }
      return decimalParsed;
    }
    if (unsigned.includes(".")) {
      if (THOUSANDS_DOT_PATTERN.test(unsigned)) {
        const parsed = Number(cleaned.replace(/\./g, ""));
        return Number.isFinite(parsed) ? parsed : null;
      }
      const decimalDotParsed = Number(cleaned);
      if (!Number.isFinite(decimalDotParsed) || Number.isInteger(decimalDotParsed)) {
        return null;
      }
      return decimalDotParsed;
    }
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const normalized = cleaned.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Formatea valores unitarios por loopoint conservando 2 decimales cuando son menores a $1. */
export function formatPointValueCOP(value: number): string {
  if (!Number.isFinite(value)) return "$ 0";
  if (value > 0 && value < 1) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
  return formatCOP(value);
}

/** Formatea cantidades con hasta 2 decimales cuando no son enteras (evita redondear 0,33 a 0). */
export function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}
