import { useCallback, useEffect, useState } from 'react';

type DraftStorage = 'local' | 'session';

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

const PREFIX = 'loopoint:draft:';

function getStorage(kind: DraftStorage): Storage | null {
  try {
    return kind === 'session' ? window.sessionStorage : window.localStorage;
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
  storage = 'local',
  version = 1,
  ttlDays = 7,
  enabled = true,
}: UseFormDraftOptions) {
  const storageKey = `${PREFIX}${key}`;
  const [hasDraft, setHasDraft] = useState(false);

  const read = useCallback((): T | null => {
    if (!enabled) return null;
    const target = getStorage(storage);
    if (!target) return null;
    try {
      const raw = target.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as DraftEnvelope<T>;
      if (parsed.version !== version) {
        target.removeItem(storageKey);
        return null;
      }
      const maxAge = ttlDays * 24 * 60 * 60 * 1000;
      if (!parsed.savedAt || Date.now() - parsed.savedAt > maxAge) {
        target.removeItem(storageKey);
        return null;
      }
      return parsed.value;
    } catch {
      return null;
    }
  }, [enabled, storage, storageKey, ttlDays, version]);

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
        setHasDraft(true);
      } catch {
        // Cuota llena o almacenamiento bloqueado: el formulario sigue en memoria.
      }
    },
    [enabled, storage, storageKey, version],
  );

  const clear = useCallback(() => {
    const target = getStorage(storage);
    try {
      target?.removeItem(storageKey);
    } catch {
      // Ignorado.
    }
    setHasDraft(false);
  }, [storage, storageKey]);

  useEffect(() => {
    setHasDraft(read() !== null);
  }, [read]);

  return { read, save, clear, hasDraft, storageKey };
}
