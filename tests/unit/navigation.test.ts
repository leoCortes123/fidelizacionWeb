import { describe, expect, it } from 'vitest';
import {
  businessHomePath,
  claimUrl,
  defaultPathForRoles,
  initials,
  oauthRedirectUrl,
  safeNextPath,
} from '@/lib/config';

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
    expect(businessHomePath('cliente')).toBe('/customer/balance');
    expect(businessHomePath(null)).toBe('/customer/balance');
  });

  it('genera iniciales para el avatar', () => {
    expect(initials('Carla Cliente')).toBe('CC');
    expect(initials('')).toBe('?');
  });
});
