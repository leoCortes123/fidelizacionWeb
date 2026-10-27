import { describe, expect, it } from 'vitest';
import { errorMessage, isBusinessError } from '@/lib/errors';

describe('mensajes de error', () => {
  it('traduce códigos de negocio del servidor', () => {
    expect(errorMessage(new Error('purchase_already_claimed'))).toContain(
      'ya fue reclamada',
    );
    expect(errorMessage({ message: 'insufficient_points' })).toContain(
      'loopoints suficientes',
    );
    expect(errorMessage(new Error('purchase_expired'))).toContain('expiró');
  });

  it('traduce errores de permisos de PostgreSQL', () => {
    expect(errorMessage(new Error('permission denied for table points_ledger'))).toContain(
      'permiso',
    );
  });

  it('conserva mensajes desconocidos', () => {
    expect(errorMessage(new Error('algo raro'))).toBe('algo raro');
  });

  it('detecta errores de negocio para no reintentar', () => {
    expect(isBusinessError(new Error('rate_limited'))).toBe(true);
    expect(isBusinessError(new Error('TypeError: fetch failed'))).toBe(false);
  });

  it('explica los límites de canje y descuentos', () => {
    expect(errorMessage(new Error('reward_period_limit_reached'))).toContain(
      'periodo',
    );
    expect(errorMessage(new Error('reward_total_limit_reached'))).toContain(
      'límite total',
    );
    expect(
      errorMessage(new Error('discount_exceeds_min_purchase')),
    ).toContain('no puede superar la compra mínima');
  });

  it('explica los timeouts de conexión', () => {
    expect(
      errorMessage(new Error('La conexión con el servidor tardó demasiado.')),
    ).toContain('tardó demasiado en responder');
  });
});
