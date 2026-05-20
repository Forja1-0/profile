import { describe, it, expect } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderPage } from "./helpers";
import { Health } from "../src/pages/Health";

describe("Health", () => {
  it("shows body data and disables backend-only field updates in demo", () => {
    renderPage(<Health />);
    expect(screen.getByText("62.4 kg")).toBeInTheDocument();
    expect(screen.getByText("168 cm")).toBeInTheDocument();
    expect(screen.getByText("21.5%")).toBeInTheDocument();
    for (const ok of screen.getAllByRole("button", { name: "OK" })) {
      expect(ok).toBeDisabled();
    }
    expect(screen.getByText(/Actualizar requiere conexión al backend/i)).toBeInTheDocument();
  });

  it("toggles the injury pain-evolution chart", async () => {
    const { user } = renderPage(<Health />);
    await user.click(screen.getByRole("tab", { name: "Lesiones" }));
    expect(screen.getByText("Aquiles derecho")).toBeInTheDocument();
    // Chart is open by default for the first injury.
    expect(screen.getByText(/Dolor reportado a lo largo del tiempo/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Ocultar evolución del dolor/i }));
    expect(screen.queryByText(/Dolor reportado a lo largo del tiempo/i)).not.toBeInTheDocument();
  });

  it("adds a new injury", async () => {
    const { user } = renderPage(<Health />);
    await user.click(screen.getByRole("tab", { name: "Lesiones" }));

    await user.click(screen.getByRole("button", { name: /Agregar lesión/i }));
    await user.type(screen.getByPlaceholderText(/Ej: Aquiles derecho/i), "Hombro de prueba");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(screen.getByText("Hombro de prueba")).toBeInTheDocument();
    expect(screen.getByText("Aquiles derecho")).toBeInTheDocument();
  });

  it("resolves the existing injury through the confirm dialog", async () => {
    const { user } = renderPage(<Health />);
    await user.click(screen.getByRole("tab", { name: "Lesiones" }));

    // Only one active injury exists, so its card button is unambiguous.
    await user.click(screen.getByRole("button", { name: /Marcar resuelta/i }));

    const dialog = screen.getByText("Marcar lesión como resuelta").closest("div.f-card") as HTMLElement;
    await user.click(within(dialog).getByRole("button", { name: /Marcar resuelta/i }));

    expect(screen.queryByText("Aquiles derecho")).not.toBeInTheDocument();
    expect(screen.getByText(/Sin lesiones activas/i)).toBeInTheDocument();
  });

  it("manages clinical data and keeps save disabled in demo", async () => {
    const { user } = renderPage(<Health />);
    await user.click(screen.getByRole("tab", { name: "Crónicas y medicación" }));
    expect(screen.getByText(/Asma leve \(ejercicio-inducida\)/i)).toBeInTheDocument();

    const chronicInput = screen.getByPlaceholderText("Ej: Asma leve");
    await user.type(chronicInput, "Hipertensión{Enter}");
    expect(screen.getByText("Hipertensión")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Guardar cambios/i })).toBeDisabled();
  });

  it("lists the document uploader and blocks uploads offline", async () => {
    const { user } = renderPage(<Health />);
    await user.click(screen.getByRole("tab", { name: "Documentos clínicos" }));
    expect(screen.getByText(/Subir nuevo documento/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Elegir archivo/i })).toBeDisabled();
    expect(screen.getByText(/Sin documentos clínicos cargados/i)).toBeInTheDocument();
  });
});
