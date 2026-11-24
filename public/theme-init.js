// Aplica el tema antes del primer pintado para evitar el destello claro.
try {
  var stored = localStorage.getItem("loopoint:theme");
  var dark =
    stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
  if (dark) document.documentElement.classList.add("dark");
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute("content", dark ? "#2b4652" : "#edf3f5");
} catch (error) {
  /* Sin almacenamiento: se usa el tema del sistema. */
}
