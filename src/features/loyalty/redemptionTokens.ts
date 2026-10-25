/**
 * El token QR de una redención se muestra una sola vez al crearlo. La base de
 * datos solo guarda su hash, así que el navegador lo conserva por pestaña en
 * `sessionStorage` y puede reemitirse mientras la solicitud siga pendiente.
 */
const KEY_PREFIX = 'loyalty:token:';

export interface StoredRedemptionToken {
  token: string;
  expires_at: string;
  code?: string;
}

function storageKey(redemptionId: string): string {
  return `${KEY_PREFIX}${redemptionId}`;
}

function getStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function saveRedemptionToken(
  redemptionId: string,
  value: StoredRedemptionToken,
): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(storageKey(redemptionId), JSON.stringify(value));
  } catch {
    // Sin almacenamiento: el QR solo vive en memoria hasta cerrar el diálogo.
  }
}

export function readRedemptionToken(
  redemptionId: string,
): StoredRedemptionToken | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(storageKey(redemptionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredRedemptionToken> | null;
    if (!parsed || typeof parsed.token !== 'string' || !parsed.token) return null;
    return {
      token: parsed.token,
      expires_at: typeof parsed.expires_at === 'string' ? parsed.expires_at : '',
      code: typeof parsed.code === 'string' ? parsed.code : undefined,
    };
  } catch {
    return null;
  }
}

export function clearRedemptionToken(redemptionId: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(storageKey(redemptionId));
  } catch {
    // Ignorado.
  }
}

export function isTokenExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  const time = new Date(expiresAt).getTime();
  if (Number.isNaN(time)) return false;
  return time <= Date.now();
}
