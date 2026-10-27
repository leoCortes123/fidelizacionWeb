import { describe, expect, it } from 'vitest';
import {
  businessHomePath,
  claimUrl,
  defaultPathForRoles,
  initials,
  oauthRedirectUrl,
  safeNextPath,
} from '@/lib/config';
import {
  clearPendingClaim,
  pendingClaimPath,
  rememberPendingClaim,
} from '@/lib/pendingClaim';

describe('navegación segura y OAuth', () => {
  it('conserva rutas internas', () => {
    expect(safeNextPath('/claim/abc')).toBe('/claim/abc');
    expect(safeNextPath('/customer/rewards?x=1')).toBe('/customer/rewards?x=1');
  });

  it('rechaza destinos externos o protocol-relative', () => {
    expect(safeNextPath('https://evil.example')).toBe('/customer');
    expect(safeNextPath('//evil.example')).toBe('/customer');
    expect(safeNextPath('/\\evil.example')).toBe('/customer');
    expect(safeNextPath('/customer\nSet-Cookie: x')).toBe('/customer');
    expect(safeNextPath(null, '/registrar')).toBe('/registrar');
  });

  it('construye la URL de callback con el token preservado', () => {
    const url = oauthRedirectUrl('/claim/token-123');
    expect(url).toContain('/auth/callback?next=');
    expect(decodeURIComponent(url.split('next=')[1])).toBe('/claim/token-123');
  });

  it('construye la URL de reclamación del QR contra la web publicada', () => {
    expect(claimUrl('abc_123')).toBe(
      'https://fidelizacion01.vercel.app/claim/abc_123',
    );
    expect(claimUrl('abc_123')).not.toContain('127.0.0.1');
    expect(claimUrl('abc_123')).not.toContain('localhost');
  });

  it('elige el portal según los roles', () => {
    expect(defaultPathForRoles(['customer'])).toBe('/customer');
    expect(defaultPathForRoles(['customer', 'registrar'])).toBe('/encargado');
    expect(defaultPathForRoles(['registrar'])).toBe('/encargado');
    expect(defaultPathForRoles(['admin'])).toBe('/admin');
    expect(defaultPathForRoles([])).toBe('/customer');
  });

  it('elige el portal según el rol dentro del negocio', () => {
    expect(businessHomePath('admin')).toBe('/admin/dashboard');
    expect(businessHomePath('encargado')).toBe('/encargado');
    expect(businessHomePath('cliente')).toBe('/customer');
    expect(businessHomePath(null)).toBe('/customer');
    expect(businessHomePath('cliente', 'biz-1')).toBe('/customer/business/biz-1');
  });

  it('genera iniciales para el avatar', () => {
    expect(initials('Carla Cliente')).toBe('CC');
    expect(initials('')).toBe('?');
  });

  it('recuerda el QR pendiente como respaldo tras autenticarse', () => {
    const token = 'tok_123456789012345678901234567890';
    rememberPendingClaim(token);
    expect(pendingClaimPath()).toBe(`/claim/${token}`);
    clearPendingClaim();
    expect(pendingClaimPath()).toBeNull();
  });

  it('descarta un QR pendiente vencido o con formato inválido', () => {
    window.localStorage.setItem(
      'fidelizacion:pending-claim',
      JSON.stringify({ token: 'tok_123456789012345678901234567890', savedAt: 0 }),
    );
    expect(pendingClaimPath()).toBeNull();

    window.localStorage.setItem(
      'fidelizacion:pending-claim',
      JSON.stringify({ token: 'corto', savedAt: Date.now() }),
    );
    expect(pendingClaimPath()).toBeNull();
  });
});
