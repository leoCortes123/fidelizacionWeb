import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isRunningStandalone(): boolean {
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

interface InstallPwaButtonProps {
  className?: string;
}

/**
 * Botón para instalar Loopoint como PWA.
 * Se oculta automáticamente cuando la app ya se ejecuta instalada (standalone).
 */
export function InstallPwaButton({ className = "btn btn-light" }: InstallPwaButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState<boolean>(() => isRunningStandalone());

  useEffect(() => {
    const media = window.matchMedia?.("(display-mode: standalone)");
    const syncStandalone = () => setStandalone(isRunningStandalone());

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setStandalone(true);
      toast.success("Loopoint instalada en tu dispositivo");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    media?.addEventListener?.("change", syncStandalone);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      media?.removeEventListener?.("change", syncStandalone);
    };
  }, []);

  if (standalone) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
      return;
    }

    if (isIosDevice()) {
      toast.info("Instala Loopoint en iPhone/iPad", {
        duration: 8000,
        description: 'Toca el botón "Compartir" en Safari y elige "Agregar a pantalla de inicio".',
      });
      return;
    }

    toast.info("Instala Loopoint desde tu navegador", {
      duration: 7000,
      description:
        'Abre el menú del navegador (⋮) o el ícono de la barra de direcciones y elige "Instalar aplicación".',
    });
  };

  return (
    <button type="button" className={className} onClick={() => void handleInstallClick()}>
      <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>Instalar app</span>
    </button>
  );
}
