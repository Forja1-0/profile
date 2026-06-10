import { render } from "@testing-library/react";
import { App } from "../src/App";
import { setSession, clearSession } from "../src/api/session";

/**
 * Renderiza la App REAL en una ruta dada. Sin mocks, sin fixtures: la suite
 * corre offline (setup.ts hace que `fetch` explote a propósito), así que el
 * comportamiento bajo test es el HONESTO — Gate sin sesión, cartel de error
 * con sesión. App usa BrowserRouter, por eso seteamos la ruta vía history.
 */
export function renderApp(route = "/perfil/inicio") {
  window.history.pushState({}, "", route);
  return render(<App />);
}

/** Crea una sesión real en localStorage (lo que mira currentUserId). NO es un
 *  mock: es el mismo token opaco que guarda el login de WhatsApp. */
export function loginTestSession() {
  setSession({
    token: "test-session-token",
    userId: "test-user",
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  });
}

export { clearSession };
