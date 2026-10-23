import { describe, expect, it } from 'vitest';
import {
  digitsOnly,
  formatCOP,
  formatCopInput,
  formatDateBogota,
  formatPoints,
  formatRedemptionCode,
  parseCopInput,
  pointsPreview,
} from '@/lib/format';

describe('formato de dinero y puntos', () => {
  it('formatea COP sin decimales', () => {
    expect(formatCOP(15500)).toContain('15.500');
    expect(formatCOP(0)).toContain('0');
  });

  it('extrae solo dígitos y rechaza entradas vacías', () => {
    expect(digitsOnly('$ 15.500')).toBe('15500');
    expect(parseCopInput('15.500')).toBe(15500);
    expect(parseCopInput('')).toBeNull();
    expect(parseCopInput('abc')).toBeNull();
  });

  it('formatea el input mientras se escribe', () => {
    expect(formatCopInput('15500')).toBe('15.500');
    expect(formatCopInput('000')).toBe('0');
    expect(formatCopInput('')).toBe('');
  });

  it('calcula puntos por miles completos', () => {
    expect(pointsPreview(15500, 1000, 500)).toBe(15);
    expect(pointsPreview(999, 1000, 500)).toBe(0);
    expect(pointsPreview(15499, 1000, 500)).toBe(15);
  });

  it('aplica el máximo de puntos por compra', () => {
    expect(pointsPreview(100000, 1000, 20)).toBe(20);
  });

  it('pluraliza puntos', () => {
    expect(formatPoints(1)).toContain('1 punto');
    expect(formatPoints(15)).toContain('15 puntos');
  });

  it('formatea fechas en America/Bogota', () => {
    const formatted = formatDateBogota('2026-10-22T02:00:00.000Z');
    expect(formatted).toContain('2026');
    // 02:00 UTC equivale al día anterior en Bogotá.
    expect(formatted).toContain('21');
  });

  it('formatea códigos de canje en bloques legibles', () => {
    expect(formatRedemptionCode('TPABC123456789')).toBe('TPAB C123 4567 89');
    expect(formatRedemptionCode('TP-ABC-123')).toBe('TPAB C123');
  });
});
