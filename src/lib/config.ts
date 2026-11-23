const trimSlash = (value: string) => value.replace(/\/+$/, "");

/**
 * Dominio publicado de la plataforma. Los QR y enlaces de invitación deben
 * abrir la web pública aunque se generen desde un entorno local, porque la
 * base de datos es la misma. Se puede sobreescribir con VITE_PUBLIC_APP_URL.
 */
export const defaultPublicAppUrl = "https://fidelizacion01.vercel.app";

export const brandName = import.meta.env.VITE_BRAND_NAME?.trim() || "Fideliapp";

export const brandTagline = import.meta.env.VITE_BRAND_TAGLINE?.trim() || "Monedas por tus compras";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || "http://127.0.0.1:54321";

export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || "public-anon-key";

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL?.trim() && import.meta.env.VITE_SUPABASE_ANON_KEY?.trim(),
);

export function publicAppUrl(): string {
  return trimSlash(import.meta.env.VITE_PUBLIC_APP_URL?.trim() || defaultPublicAppUrl);
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

/**
 * URL que se codifica dentro del QR de invitación de miembros. Abre el
 * registro sin selector de tipo de cuenta y aplica el rol configurado.
 */
export function memberInviteUrl(token: string): string {
  return `${publicAppUrl()}/login?mode=register&invite=${encodeURIComponent(token)}`;
}

export function oauthRedirectUrl(nextPath?: string): string {
  const base = `${window.location.origin}/auth/callback`;
  if (!nextPath) return base;
  return `${base}?next=${encodeURIComponent(nextPath)}`;
}

export function safeNextPath(next: string | null | undefined, fallback = "/customer"): string {
  if (!next) return fallback;
  // Solo rutas internas. Se rechazan URLs protocol-relative, barras invertidas
  // (algunos navegadores las normalizan a //) y caracteres de control.
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  if (next.includes("\\") || /[\u0000-\u001f\u007f]/.test(next)) return fallback;
  return next;
}

export function defaultPathForRoles(roles: string[]): string {
  if (roles.includes("admin")) return "/admin";
  if (roles.includes("registrar") || roles.includes("encargado")) return "/encargado";
  return "/customer";
}

/**
 * Indica si la ruta `next` es una pantalla inicial genérica de algún portal.
 * Al iniciar sesión con cualquier rol, estas rutas no deben forzar el portal
 * de otro rol (por ejemplo `/customer` tras cerrar sesión), sino resolver el
 * inicio real del usuario autenticado.
 */
export function isGenericPortalPath(path: string | null | undefined): boolean {
  if (!path) return true;
  const pathname = path.split("?")[0]?.split("#")[0]?.replace(/\/+$/, "") || "/";
  return (
    pathname === "/" ||
    pathname === "/customer" ||
    pathname === "/admin" ||
    pathname === "/admin/dashboard" ||
    pathname === "/encargado"
  );
}

/**
 * Verifica si una ruta específica (`next`) es compatible con los roles del
 * usuario que acaba de iniciar sesión. Los flujos compartidos (`/claim`,
 * `/join`, `/scan`, `/perfil`, `/business`, `/admin/onboarding`) siempre se
 * conservan; las rutas internas de un portal incompatible se descartan para
 * redirigir al inicio correspondiente al rol.
 */
export function isNextPathCompatibleWithRoles(
  path: string | null | undefined,
  roles: string[],
): boolean {
  if (!path || isGenericPortalPath(path)) return false;
  const pathname = path.split("?")[0]?.split("#")[0] ?? "";
  if (
    pathname.startsWith("/claim/") ||
    pathname.startsWith("/join/") ||
    pathname.startsWith("/scan/") ||
    pathname.startsWith("/admin/onboarding") ||
    pathname.startsWith("/business/") ||
    pathname === "/perfil"
  ) {
    return true;
  }
  const isAdmin = roles.includes("admin");
  const isRegistrar = roles.includes("registrar") || roles.includes("encargado");
  if (pathname.startsWith("/admin")) return isAdmin;
  if (pathname.startsWith("/encargado")) return isAdmin || isRegistrar;
  if (pathname.startsWith("/customer")) return !isAdmin && !isRegistrar;
  return true;
}

/** Portal de inicio según el rol del usuario dentro de un negocio concreto. */
export function businessHomePath(
  role: string | null | undefined,
  businessId?: string | null,
): string {
  if (role === "admin") return "/admin/dashboard";
  if (role === "encargado") return "/encargado";
  if (businessId) return `/customer/business/${businessId}`;
  return "/customer";
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return `${parts[0][0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}
