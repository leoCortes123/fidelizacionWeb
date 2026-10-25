const STORAGE_KEY = 'fidelizacion:pending-claim';
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,100}$/;
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

interface PendingClaim {
  token: string;
  savedAt: number;
}

/**
 * Recuerda el QR que el cliente está reclamando. Sirve de respaldo cuando el
 * proveedor de autenticación no conserva el parámetro `next` (por ejemplo, al
 * confirmar el correo en otra pestaña). Caduca a las 2 horas.
 */
export function rememberPendingClaim(token: string): void {
  if (!TOKEN_PATTERN.test(token)) return;
  try {
    const value: PendingClaim = { token, savedAt: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Sin almacenamiento: el flujo normal con `next` sigue funcionando.
  }
}

export function clearPendingClaim(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignorado.
  }
}

/** Ruta del QR pendiente, o null si no hay uno vigente. */
export function pendingClaimPath(): string | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<PendingClaim>;
    if (
      typeof value.token !== 'string' ||
      !TOKEN_PATTERN.test(value.token) ||
      typeof value.savedAt !== 'number' ||
      Date.now() - value.savedAt > MAX_AGE_MS
    ) {
      clearPendingClaim();
      return null;
    }
    return `/claim/${value.token}`;
  } catch {
    clearPendingClaim();
    return null;
  }
}
