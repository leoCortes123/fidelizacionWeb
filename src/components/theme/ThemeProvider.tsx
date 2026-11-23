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

const THEME_STORAGE_KEY = "loopoint:theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme() ?? systemTheme());

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Sin almacenamiento: el tema sigue funcionando en esta sesión.
    }

    const colorSchemeMeta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
    if (colorSchemeMeta) {
      colorSchemeMeta.content = theme === systemTheme() ? "light dark" : theme;
    }

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      const isWarmPortal = root.dataset.portal === "customer" || root.dataset.portal === "admin";
      meta.setAttribute(
        "content",
        theme === "dark"
          ? isWarmPortal
            ? "#181615"
            : "#090f1a"
          : isWarmPortal
            ? "#f6edda"
            : "#f8fafc",
      );
    }
  }, [theme]);

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

  const setTheme = useCallback((next: Theme) => setThemeState(next), []);
  const toggleTheme = useCallback(
    () => setThemeState((current) => (current === "dark" ? "light" : "dark")),
    [],
  );

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
 * Aplica la paleta del portal al documento mientras la pantalla está montada.
 * Tanto el cliente como el negocio (admin y encargado) comparten la paleta cálida Loopoint.
 */
export function usePortalTheme(portal: Portal) {
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.dataset.portal;
    root.dataset.portal = portal;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", root.classList.contains("dark") ? "#181615" : "#f6edda");
    }
    return () => {
      if (previous) root.dataset.portal = previous;
      else delete root.dataset.portal;
    };
  }, [portal]);
}
