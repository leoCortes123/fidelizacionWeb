import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";
export type Portal = "admin" | "customer";

export const THEME_STORAGE_KEY = "fideliapp:theme";
// Clave heredada de la marca anterior; se migra una sola vez al leer y se elimina.
export const LEGACY_THEME_STORAGE_KEY = "loopoint:theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readStoredTheme(): Theme | null {
  try {
    const rawStored = window.localStorage.getItem(THEME_STORAGE_KEY);
    let stored: Theme | null = rawStored === "light" || rawStored === "dark" ? rawStored : null;
    const legacy = window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
    if (!stored && (legacy === "light" || legacy === "dark")) {
      stored = legacy;
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, legacy);
        window.localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
      } catch {
        // Conserva legacy si setItem falla.
      }
    } else if (legacy !== null) {
      window.localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
    }
    return stored;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

function persistTheme(theme: Theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Sin almacenamiento: el tema sigue funcionando en esta sesión.
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme() ?? systemTheme());

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;

    const colorSchemeMeta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
    if (colorSchemeMeta) {
      colorSchemeMeta.content = theme === systemTheme() ? "light dark" : theme;
    }

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", theme === "dark" ? "#2b4652" : "#edf3f5");
    }
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media?.addEventListener) return;
    const onSystemChange = (event: MediaQueryListEvent) => {
      if (readStoredTheme() !== null) return;
      setThemeState(event.matches ? "dark" : "light");
    };
    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      const next: Theme =
        event.newValue === "dark" || event.newValue === "light" ? event.newValue : systemTheme();
      setThemeState(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    persistTheme(next);
    setThemeState(next);
  }, []);
  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";
      persistTheme(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme debe usarse dentro de ThemeProvider");
  return context;
}

export function useOptionalTheme() {
  return useContext(ThemeContext);
}

/**
 * Aplica el identificador del portal al documento mientras la pantalla está montada.
 * Todo el sistema comparte la paleta 65/25/10 de la landing (claro #edf3f5 / oscuro #2b4652).
 */
export function usePortalTheme(portal: Portal) {
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.dataset.portal;
    root.dataset.portal = portal;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", root.classList.contains("dark") ? "#2b4652" : "#edf3f5");
    }
    return () => {
      if (previous) root.dataset.portal = previous;
      else delete root.dataset.portal;
    };
  }, [portal]);
}
