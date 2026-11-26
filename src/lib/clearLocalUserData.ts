import { DRAFT_STORAGE_PREFIX, LEGACY_DRAFT_STORAGE_PREFIX } from "./useFormDraft";

const LOCAL_PREFIXES_TO_PURGE = [
  DRAFT_STORAGE_PREFIX,
  LEGACY_DRAFT_STORAGE_PREFIX,
  "fidelizacion:selected-business",
  "fidelizacion:onboarding:",
] as const;

const LOCAL_EXACT_KEYS_TO_PURGE = new Set<string>([
  "fidelizacion:selected-business",
  "fidelizacion:pending-claim",
]);

function shouldPurgeLocalKey(key: string): boolean {
  if (LOCAL_EXACT_KEYS_TO_PURGE.has(key)) return true;
  return LOCAL_PREFIXES_TO_PURGE.some((prefix) => key.startsWith(prefix));
}

/**
 * Purga datos locales asociados al usuario en el navegador al cerrar sesión o
 * eliminar la cuenta (borradores de formularios con teléfono/cumpleaños,
 * negocio seleccionado, QR pendiente y todo `sessionStorage`).
 *
 * Conserva preferencias de dispositivo no personales como el tema (`fideliapp:theme`).
 */
export function clearLocalUserData(): void {
  try {
    const storage = window.localStorage;
    const keysToRemove: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key && shouldPurgeLocalKey(key)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      storage.removeItem(key);
    }
  } catch {
    // Almacenamiento bloqueado o no disponible.
  }

  try {
    window.sessionStorage.clear();
  } catch {
    // Ignorado.
  }
}
