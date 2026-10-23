const trimSlash = (value: string) => value.replace(/\/+$/, '');

export const brandName =
  import.meta.env.VITE_BRAND_NAME?.trim() || 'Mi Negocio';

export const brandTagline =
  import.meta.env.VITE_BRAND_TAGLINE?.trim() || 'Puntos por tus compras';

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
    import.meta.env.VITE_PUBLIC_APP_URL?.trim() || window.location.origin,
  );
}

export function claimUrl(token: string): string {
  return `${publicAppUrl()}/claim/${encodeURIComponent(token)}`;
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
  return '/customer';
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return `${parts[0][0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
}
