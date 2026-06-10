import { describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderApp, loginTestSession, clearSession } from "./helpers";

/**
 * El perfil web NO tiene modo demo: nunca muestra datos inventados. Estos tests
 * verifican esa honestidad sin mocks ni fixtures:
 *   - sin sesión  → Gate (entrá por WhatsApp), nada de perfil.
 *   - con sesión, offline (no se puede cargar) → cartel honesto "no pudimos
 *     cargar tus datos", y CERO datos fabricados.
 * "offline" es real: setup.ts hace que cualquier fetch explote.
 */

// Strings del viejo modo demo. Si alguno reaparece, volvimos a inventar datos.
const FABRICATED = ["Rocío", "IRONMAN 5150 San Juan", "Sentadilla", "Rocío Mendoza"];

// Rutas elite (VITE_FORJA_MODE=elite en vitest.config).
const PROFILE_ROUTES = [
  "/perfil/inicio",
  "/perfil/nutricion",
  "/perfil/entrenamiento",
  "/perfil/salud",
  "/perfil/configuracion",
  "/perfil/journey",
  "/perfil/suscripcion",
];

describe("web_profile — honestidad de datos (sin modo demo)", () => {
  beforeEach(() => clearSession());

  it("sin sesión → Gate (entrá por WhatsApp), nunca el perfil ni datos inventados", () => {
    renderApp("/perfil/inicio");
    expect(screen.getByText(/Tu perfil vive detrás de WhatsApp/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Abrir Forja en WhatsApp/i })).toBeInTheDocument();
    for (const f of FABRICATED) expect(screen.queryByText(f)).not.toBeInTheDocument();
  });

  describe("con sesión pero offline (no se pueden cargar los datos)", () => {
    beforeEach(() => loginTestSession());

    it("muestra el cartel honesto y ningún dato inventado", async () => {
      renderApp("/perfil/inicio");
      expect(await screen.findByText(/No pudimos cargar tus datos/i)).toBeInTheDocument();
      for (const f of FABRICATED) expect(screen.queryByText(f)).not.toBeInTheDocument();
    });

    it("la navegación del perfil sigue presente (UI estática, no datos)", async () => {
      renderApp("/perfil/inicio");
      await screen.findByText(/No pudimos cargar tus datos/i);
      for (const label of [/Nutrición/i, /Entreno/i, /Salud/i]) {
        expect(screen.getAllByRole("link", { name: label }).length).toBeGreaterThan(0);
      }
    });

    it("mantiene el disclaimer legal y un acceso a WhatsApp", async () => {
      renderApp("/perfil/inicio");
      await screen.findByText(/No pudimos cargar tus datos/i);
      expect(screen.getByText(/Forja no constituye asesoramiento médico/i)).toBeInTheDocument();
      const waLinks = screen
        .getAllByRole("link")
        .filter((a) => a.getAttribute("href")?.includes("wa.me"));
      expect(waLinks.length).toBeGreaterThan(0);
    });

    for (const route of PROFILE_ROUTES) {
      it(`ruta ${route} → cartel offline, sin pantalla en blanco`, async () => {
        renderApp(route);
        expect(await screen.findByText(/No pudimos cargar tus datos/i)).toBeInTheDocument();
      });
    }
  });
});
