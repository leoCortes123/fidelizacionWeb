import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PixelDownloadIcon } from "@/components/shared/PixelDownloadIcon";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function isRunningStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true || nav.standalone === true
  );
}

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

// Estado compartido a nivel de módulo para evitar listeners y toasts duplicados
// cuando la página renderiza varios botones de instalación simultáneamente.
interface PwaInstallSnapshot {
  deferredPrompt: BeforeInstallPromptEvent | null;
  standalone: boolean;
}

const listeners = new Set<() => void>();
let initialized = false;
let snapshot: PwaInstallSnapshot = {
  deferredPrompt: null,
  standalone: isRunningStandalone(),
};

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function ensureWindowListeners() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const media = window.matchMedia?.("(display-mode: standalone)");
  const syncStandalone = () => {
    const next = isRunningStandalone();
    if (next !== snapshot.standalone) {
      snapshot = { ...snapshot, standalone: next };
      emitChange();
    }
  };

  window.addEventListener("beforeinstallprompt", (event: Event) => {
    event.preventDefault();
    snapshot = { ...snapshot, deferredPrompt: event as BeforeInstallPromptEvent };
    emitChange();
  });

  window.addEventListener("appinstalled", () => {
    snapshot = { deferredPrompt: null, standalone: true };
    emitChange();
    toast.success("Fideliapp instalada en tu dispositivo");
  });

  media?.addEventListener?.("change", syncStandalone);
}

/** Solo para pruebas unitarias: restablece el snapshot compartido entre tests. */
export function resetInstallPwaStateForTests() {
  snapshot = {
    deferredPrompt: null,
    standalone: isRunningStandalone(),
  };
  emitChange();
}

/** Reactivo al modo standalone y al evento `appinstalled`. */
export function useIsStandalone(): boolean {
  const [standalone, setStandalone] = useState<boolean>(() => {
    ensureWindowListeners();
    return snapshot.standalone;
  });

  useEffect(() => {
    ensureWindowListeners();
    const sync = () => setStandalone(snapshot.standalone);
    listeners.add(sync);
    sync();
    return () => {
      listeners.delete(sync);
    };
  }, []);

  return standalone;
}

interface InstallPwaButtonProps {
  className?: string;
  label?: string;
}

/**
 * Botón para instalar Fideliapp como PWA.
 * Se oculta automáticamente cuando la app ya se ejecuta instalada (standalone).
 */
export function InstallPwaButton({
  className = "btn btn-light",
  label = "Instalar app",
}: InstallPwaButtonProps) {
  const [state, setState] = useState<PwaInstallSnapshot>(() => {
    ensureWindowListeners();
    return snapshot;
  });

  useEffect(() => {
    ensureWindowListeners();
    const sync = () => setState(snapshot);
    listeners.add(sync);
    sync();
    return () => {
      listeners.delete(sync);
    };
  }, []);

  if (state.standalone) return null;

  const handleInstallClick = async () => {
    const promptEvent = snapshot.deferredPrompt;
    if (promptEvent) {
      // Chromium solo permite invocar prompt() una vez por evento (incluso si el usuario lo descarta).
      snapshot = { ...snapshot, deferredPrompt: null };
      emitChange();
      try {
        await promptEvent.prompt();
        await promptEvent.userChoice;
        return;
      } catch {
        // Si el navegador rechaza el prompt, mostramos las instrucciones manuales.
      }
    }

    if (isIosDevice()) {
      toast.info("Instala Fideliapp en iPhone/iPad", {
        duration: 8000,
        description: 'Toca el botón "Compartir" en Safari y elige "Agregar a pantalla de inicio".',
      });
      return;
    }

    toast.info("Instala Fideliapp desde tu navegador", {
      duration: 7000,
      description:
        'Abre el menú del navegador (⋮) o el ícono de la barra de direcciones y elige "Instalar aplicación".',
    });
  };

  return (
    <button type="button" className={className} onClick={() => void handleInstallClick()}>
      <PixelDownloadIcon size={16} className="shrink-0" />
      <span>{label}</span>
    </button>
  );
}
