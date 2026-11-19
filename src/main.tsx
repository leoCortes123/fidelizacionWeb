import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./index.css";

// Si un despliegue nuevo invalida un chunk lazy en una pestaña abierta, recarga una sola vez.
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  const key = "fideliapp:preload-reload";
  const lastReload = Number(sessionStorage.getItem(key) ?? "0");
  if (Date.now() - lastReload < 10_000) return;
  sessionStorage.setItem(key, String(Date.now()));
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
