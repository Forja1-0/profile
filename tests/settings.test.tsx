import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderPage } from "./helpers";
import { Settings } from "../src/pages/Settings";

describe("Settings", () => {
  it("lists reminders, toggles one, and adds a custom reminder", async () => {
    const { user } = renderPage(<Settings />);
    expect(screen.getByText("Recordatorio matutino")).toBeInTheDocument();

    const toggle = screen.getByRole("button", { name: "Recordatorio matutino" });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    expect(screen.getByText(/Recordatorios personalizados \(1\/5\)/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "add" }));
    expect(screen.getByText(/Recordatorios personalizados \(2\/5\)/i)).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /Guardar recordatorios/i })).toBeDisabled();
  });

  it("changes the bot personality and updates the sample message", async () => {
    const { user } = renderPage(<Settings />);
    await user.click(screen.getByRole("tab", { name: "Personalidad" }));
    expect(screen.getByText(/Hoy no se negocia\. Bici Z2/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Empático/i }));
    expect(screen.getByText(/¿Cómo te sentís hoy\?/i)).toBeInTheDocument();
  });

  it("renders privacy options with toggles", async () => {
    const { user } = renderPage(<Settings />);
    await user.click(screen.getByRole("tab", { name: "Privacidad" }));
    expect(screen.getByText(/Newsletter \/ comunicaciones de Forja/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Aparecer en el ranking de Performance Score/i }),
    ).toBeInTheDocument();
  });

  it("prefills personal data and disables destructive actions offline", async () => {
    const { user } = renderPage(<Settings />);
    await user.click(screen.getByRole("tab", { name: "Datos personales" }));
    expect(screen.getByDisplayValue("Rocío Mendoza")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Guardar cambios/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Eliminar cuenta/i })).toBeDisabled();
  });

  it("shows connections with WhatsApp and locked wearables", async () => {
    const { user } = renderPage(<Settings />);
    await user.click(screen.getByRole("tab", { name: "Conexiones" }));
    expect(screen.getByText("WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("Garmin Connect")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Conectar" })[0]).toBeDisabled();
  });
});
