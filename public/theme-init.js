// Aplica el tema antes del primer pintado para evitar el destello claro.
try {
  var THEME_KEY = "fideliapp:theme";
  var LEGACY_THEME_KEY = "loopoint:theme";
  var rawStored = localStorage.getItem(THEME_KEY);
  var stored = rawStored === "dark" || rawStored === "light" ? rawStored : null;
  var legacy = localStorage.getItem(LEGACY_THEME_KEY);
  if (!stored && (legacy === "dark" || legacy === "light")) {
    stored = legacy;
    localStorage.setItem(THEME_KEY, legacy);
    localStorage.removeItem(LEGACY_THEME_KEY);
  } else if (legacy !== null) {
    localStorage.removeItem(LEGACY_THEME_KEY);
  }
  var dark =
    stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
  if (dark) document.documentElement.classList.add("dark");
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute("content", dark ? "#2b4652" : "#edf3f5");
} catch (error) {
  /* Sin almacenamiento: se usa el tema del sistema. */
}
