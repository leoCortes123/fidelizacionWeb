import { useEffect, useState } from "react";
import { useOptionalTheme } from "@/components/theme/ThemeProvider";

const STORAGE_KEY = "loopoint:theme";

function getSystemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

function readIsDark(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

function syncDocumentTheme(target: "light" | "dark", persist: boolean) {
  const root = document.documentElement;
  const isDark = target === "dark";
  root.classList.toggle("dark", isDark);
  root.style.colorScheme = target;

  const systemScheme = getSystemPrefersDark() ? "dark" : "light";
  const colorSchemeMeta = document.head.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
  if (colorSchemeMeta) {
    colorSchemeMeta.content = target === systemScheme ? "light dark" : target;
  }

  const themeColorMeta = document.head.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.content = isDark ? "#090f1a" : "#f8fafc";
  }

  if (!persist) return;
  try {
    if (target === systemScheme) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, target);
    }
  } catch {
    // Sin acceso a localStorage; el tema visual sigue aplicado en la sesión.
  }
}

/**
 * Ícono pixel art de 32 bits (cuadrícula 16x16 con bordes nítidos):
 * muestra una luna creciente con estrellas en modo claro (para pasar a oscuro)
 * y un sol dorado sombreado en modo oscuro (para pasar a claro).
 */
function PixelThemeIcon({ isDark }: { isDark: boolean }) {
  if (isDark) {
    // Sol pixel art 32-bit con contorno negro (#0f172a / #16262e) en rayos y disco
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 16 16"
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        {/* Contorno negro de rayos cardinales */}
        <rect x="7" y="0" width="2" height="1" fill="#0f172a" />
        <rect x="6" y="1" width="1" height="2" fill="#0f172a" />
        <rect x="9" y="1" width="1" height="2" fill="#0f172a" />

        <rect x="7" y="15" width="2" height="1" fill="#0f172a" />
        <rect x="6" y="13" width="1" height="2" fill="#0f172a" />
        <rect x="9" y="13" width="1" height="2" fill="#0f172a" />

        <rect x="0" y="7" width="1" height="2" fill="#0f172a" />
        <rect x="1" y="6" width="2" height="1" fill="#0f172a" />
        <rect x="1" y="9" width="2" height="1" fill="#0f172a" />

        <rect x="15" y="7" width="1" height="2" fill="#0f172a" />
        <rect x="13" y="6" width="2" height="1" fill="#0f172a" />
        <rect x="13" y="9" width="2" height="1" fill="#0f172a" />

        {/* Rayos cardinales dorados */}
        <rect x="7" y="1" width="2" height="2" fill="#fad24b" />
        <rect x="7" y="13" width="2" height="2" fill="#e89c1c" />
        <rect x="1" y="7" width="2" height="2" fill="#fad24b" />
        <rect x="13" y="7" width="2" height="2" fill="#e89c1c" />

        {/* Rayos diagonales con borde negro */}
        <rect x="2" y="2" width="1" height="1" fill="#0f172a" />
        <rect x="3" y="3" width="1" height="1" fill="#fad24b" />
        <rect x="13" y="2" width="1" height="1" fill="#0f172a" />
        <rect x="12" y="3" width="1" height="1" fill="#fad24b" />
        <rect x="2" y="13" width="1" height="1" fill="#0f172a" />
        <rect x="3" y="12" width="1" height="1" fill="#e89c1c" />
        <rect x="13" y="13" width="1" height="1" fill="#0f172a" />
        <rect x="12" y="12" width="1" height="1" fill="#e89c1c" />

        {/* Contorno negro del disco solar */}
        <rect x="6" y="4" width="4" height="1" fill="#0f172a" />
        <rect x="5" y="5" width="1" height="1" fill="#0f172a" />
        <rect x="10" y="5" width="1" height="1" fill="#0f172a" />
        <rect x="4" y="6" width="1" height="4" fill="#0f172a" />
        <rect x="11" y="6" width="1" height="4" fill="#0f172a" />
        <rect x="5" y="10" width="1" height="1" fill="#0f172a" />
        <rect x="10" y="10" width="1" height="1" fill="#0f172a" />
        <rect x="6" y="11" width="4" height="1" fill="#0f172a" />

        {/* Relleno 32-bit con brillo y sombra cálida */}
        <rect x="6" y="5" width="4" height="1" fill="#fff8e6" />
        <rect x="5" y="6" width="6" height="4" fill="#fad24b" />
        <rect x="6" y="6" width="2" height="2" fill="#fff8e6" />
        <rect x="9" y="8" width="2" height="2" fill="#e89c1c" />
        <rect x="6" y="10" width="4" height="1" fill="#d97706" />
      </svg>
    );
  }

  // Luna creciente + estrellas pixel art 32-bit
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
      {/* Estrellas doradas */}
      <rect x="12" y="2" width="1" height="1" fill="#fad24b" />
      <rect x="11" y="3" width="3" height="1" fill="#fff8e6" />
      <rect x="12" y="4" width="1" height="1" fill="#fad24b" />
      <rect x="13" y="7" width="1" height="1" fill="#fad24b" />
      {/* Contorno exterior de la luna */}
      <rect x="6" y="2" width="4" height="1" fill="#16262e" />
      <rect x="4" y="3" width="2" height="1" fill="#16262e" />
      <rect x="3" y="4" width="1" height="2" fill="#16262e" />
      <rect x="2" y="6" width="1" height="4" fill="#16262e" />
      <rect x="3" y="10" width="1" height="2" fill="#16262e" />
      <rect x="4" y="12" width="2" height="1" fill="#16262e" />
      <rect x="6" y="13" width="5" height="1" fill="#16262e" />
      <rect x="11" y="12" width="2" height="1" fill="#16262e" />
      {/* Relleno creciente con luz y sombra */}
      <rect x="6" y="3" width="3" height="1" fill="#fff8e6" />
      <rect x="4" y="4" width="4" height="2" fill="#d5e4ea" />
      <rect x="5" y="4" width="2" height="1" fill="#fff8e6" />
      <rect x="3" y="6" width="4" height="4" fill="#d5e4ea" />
      <rect x="3" y="8" width="2" height="2" fill="#9ebbc6" />
      <rect x="4" y="10" width="5" height="2" fill="#9ebbc6" />
      <rect x="6" y="12" width="5" height="1" fill="#7fa2b0" />
      {/* Borde interior de la media luna */}
      <rect x="8" y="4" width="1" height="2" fill="#16262e" />
      <rect x="7" y="6" width="1" height="3" fill="#16262e" />
      <rect x="8" y="9" width="2" height="1" fill="#16262e" />
      <rect x="10" y="10" width="2" height="2" fill="#16262e" />
    </svg>
  );
}

export function ThemeToggleButton() {
  const themeContext = useOptionalTheme();
  const [localDark, setLocalDark] = useState<boolean>(() => readIsDark());
  const isDark = themeContext ? themeContext.theme === "dark" : localDark;

  useEffect(() => {
    if (themeContext) return;
    setLocalDark(readIsDark());

    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const next =
        event.newValue === "dark" || (event.newValue !== "light" && getSystemPrefersDark());
      syncDocumentTheme(next ? "dark" : "light", false);
      setLocalDark(next);
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [themeContext]);

  const handleToggle = () => {
    const nextScheme = isDark ? "light" : "dark";
    if (themeContext) {
      themeContext.setTheme(nextScheme);
    }
    syncDocumentTheme(nextScheme, !themeContext);
    setLocalDark(nextScheme === "dark");
  };

  return (
    <button
      type="button"
      className="btn btn-light btn-xs theme-toggle-btn"
      onClick={handleToggle}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
    >
      <PixelThemeIcon isDark={isDark} />
    </button>
  );
}
