const trimSlash = (value: string) => value.replace(/\/+$/, '');

/**
 * Dominio publicado de la plataforma. Los QR y enlaces de invitación deben
 * abrir la web pública aunque se generen desde un entorno local, porque la
 * base de datos es la misma. Se puede sobreescribir con VITE_PUBLIC_APP_URL.
 */
export const defaultPublicAppUrl = 'https://fidelizacion01.vercel.app';

export const brandName =
  import.meta.env.VITE_BRAND_NAME?.trim() || 'Loopoint';

export const brandTagline =
  import.meta.env.VITE_BRAND_TAGLINE?.trim() || 'Loopoints por tus compras';

export const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL?.trim() || 'http://127.0.0.1:54321';

export const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || 'public-anon-key';

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL?.trim() &&
    import.meta.env.VITE_SUPABASE_ANON_KEY?.trim(),
);

export function publicAppUrl(): string {
  return trimSlash(
    import.meta.env.VITE_PUBLIC_APP_URL?.trim() || defaultPublicAppUrl,
  );
}

export function claimUrl(token: string): string {
  return `${publicAppUrl()}/claim/${encodeURIComponent(token)}`;
}

/**
 * URL que se codifica dentro del QR de canje. Al escanearla, el encargado
 * autenticado confirma la entrega desde `/scan/:token`.
 */
export function redemptionScanUrl(token: string): string {
  return `${publicAppUrl()}/scan/${encodeURIComponent(token)}`;
}

export function oauthRedirectUrl(nextPath?: string): string {
  const base = `${window.location.origin}/auth/callback`;
  if (!nextPath) return base;
  return `${base}?next=${encodeURIComponent(nextPath)}`;
}

export function safeNextPath(
  next: string | null | undefined,
  fallback = '/customer',
): string {
  if (!next) return fallback;
  // Solo rutas internas. Se rechazan URLs protocol-relative, barras invertidas
  // (algunos navegadores las normalizan a //) y caracteres de control.
  if (!next.startsWith('/') || next.startsWith('//')) return fallback;
  if (next.includes('\\') || /[\u0000-\u001f\u007f]/.test(next)) return fallback;
  return next;
}

export function defaultPathForRoles(roles: string[]): string {
  if (roles.includes('admin')) return '/admin';
  if (roles.includes('registrar')) return '/encargado';
  return '/customer';
}

/** Portal de inicio según el rol del usuario dentro de un negocio concreto. */
export function businessHomePath(role: string | null | undefined): string {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'encargado') return '/encargado';
  return '/customer/balance';
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return `${parts[0][0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
}
