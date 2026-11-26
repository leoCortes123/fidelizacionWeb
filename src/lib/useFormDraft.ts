import { useCallback, useEffect, useState } from "react";

type DraftStorage = "local" | "session";

interface UseFormDraftOptions {
  /** Identificador estable del formulario (usuario, negocio, pantalla). */
  key: string;
  storage?: DraftStorage;
  /** Súbelo cuando cambie la forma del formulario para invalidar borradores viejos. */
  version?: number;
  /** Días que se conserva un borrador. */
  ttlDays?: number;
  enabled?: boolean;
}

interface DraftEnvelope<T> {
  version: number;
  savedAt: number;
  value: T;
}

export const DRAFT_STORAGE_PREFIX = "fideliapp:draft:";
// Clave heredada de la marca anterior; se migra una sola vez al leer y se elimina.
export const LEGACY_DRAFT_STORAGE_PREFIX = "loopoint:draft:";

function getStorage(kind: DraftStorage): Storage | null {
  try {
    return kind === "session" ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Persiste el estado de un formulario en el navegador para que no se pierda al
 * cambiar de pestaña, minimizar la app o recargar. No guarda secretos.
 */
export function useFormDraft<T>({
  key,
  storage = "local",
  version = 1,
  ttlDays = 7,
  enabled = true,
}: UseFormDraftOptions) {
  const storageKey = `${DRAFT_STORAGE_PREFIX}${key}`;
  const legacyKey = `${LEGACY_DRAFT_STORAGE_PREFIX}${key}`;
  const [hasDraft, setHasDraft] = useState(false);

  const read = useCallback((): T | null => {
    if (!enabled) return null;
    const target = getStorage(storage);
    if (!target) return null;
    try {
      const currentRaw = target.getItem(storageKey);
      const legacyRaw = target.getItem(legacyKey);
      const raw = currentRaw ?? legacyRaw;
      const migratedFromLegacy = !currentRaw && Boolean(legacyRaw);

      if (currentRaw && legacyRaw !== null) {
        target.removeItem(legacyKey);
      }
      if (!raw) return null;

      let parsed: DraftEnvelope<T>;
      try {
        parsed = JSON.parse(raw) as DraftEnvelope<T>;
      } catch {
        target.removeItem(migratedFromLegacy ? legacyKey : storageKey);
        return null;
      }

      if (parsed.version !== version) {
        target.removeItem(migratedFromLegacy ? legacyKey : storageKey);
        return null;
      }
      const maxAge = ttlDays * 24 * 60 * 60 * 1000;
      if (!parsed.savedAt || Date.now() - parsed.savedAt > maxAge) {
        target.removeItem(migratedFromLegacy ? legacyKey : storageKey);
        return null;
      }
      if (migratedFromLegacy) {
        try {
          target.setItem(storageKey, raw);
          target.removeItem(legacyKey);
        } catch {
          // Si falla escribir (p. ej. QuotaExceededError), conservamos el borrador heredado.
        }
      }
      return parsed.value;
    } catch {
      return null;
    }
  }, [enabled, legacyKey, storage, storageKey, ttlDays, version]);

  const save = useCallback(
    (value: T) => {
      if (!enabled) return;
      const target = getStorage(storage);
      if (!target) return;
      try {
        const envelope: DraftEnvelope<T> = {
          version,
          savedAt: Date.now(),
          value,
        };
        target.setItem(storageKey, JSON.stringify(envelope));
        if (target.getItem(legacyKey) !== null) {
          target.removeItem(legacyKey);
        }
        setHasDraft(true);
      } catch {
        // Cuota llena o almacenamiento bloqueado: el formulario sigue en memoria.
      }
    },
    [enabled, legacyKey, storage, storageKey, version],
  );

  const clear = useCallback(() => {
    const target = getStorage(storage);
    try {
      target?.removeItem(storageKey);
      target?.removeItem(legacyKey);
    } catch {
      // Ignorado.
    }
    setHasDraft(false);
  }, [legacyKey, storage, storageKey]);

  useEffect(() => {
    setHasDraft(read() !== null);
  }, [read]);

  return { read, save, clear, hasDraft, storageKey };
}
