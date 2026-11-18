import { useEffect } from "react";
import { toast } from "sonner";
import { useRegisterSW } from "virtual:pwa-register/react";

const UPDATE_TOAST_ID = "pwa-update-available";

/**
 * Registra el Service Worker de la PWA y avisa al usuario cuando hay una
 * nueva versión disponible para evitar recargas inesperadas durante una venta o canje.
 */
export function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error: unknown) {
      if (import.meta.env.DEV) {
        console.warn("[PWA] Error al registrar Service Worker:", error);
      }
    },
  });

  useEffect(() => {
    if (!needRefresh) return;
    toast.info("Nueva versión de Loopoint disponible", {
      id: UPDATE_TOAST_ID,
      duration: Infinity,
      description: "Actualiza para usar las últimas mejoras.",
      action: {
        label: "Actualizar",
        onClick: () => {
          void updateServiceWorker(true);
        },
      },
    });
  }, [needRefresh, updateServiceWorker]);

  return null;
}
