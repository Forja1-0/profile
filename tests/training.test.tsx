import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderPage } from "./helpers";
import { Training } from "../src/pages/Training";

describe("Training", () => {
  it("renders the weekly plan with all days by default", () => {
    renderPage(<Training />);
    expect(screen.getByRole("tab", { name: "Plan semanal" })).toHaveAttribute("aria-selected", "true");
    for (const d of ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]) {
      expect(screen.getByText(d)).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: /Editar plan completo/i })).toBeInTheDocument();
  });

  it("opens and closes the day editor sheet", async () => {
    const { user } = renderPage(<Training />);
    await user.click(screen.getByRole("button", { name: /Lunes/i }));
    expect(screen.getByText("Editar — Lunes")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByText("Editar — Lunes")).not.toBeInTheDocument();
  });

  it("shows session history with stats and status pills", async () => {
    const { user } = renderPage(<Training />);
    await user.click(screen.getByRole("tab", { name: "Historial de sesiones" }));
    expect(screen.getByText("97.4%")).toBeInTheDocument();
    expect(screen.getAllByText("Completada").length).toBeGreaterThan(0);
    expect(screen.getByText("Saltada")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "12 sem" }));
    expect(screen.getByRole("button", { name: "12 sem" })).toHaveAttribute("aria-selected", "true");
  });

  it("adds and deletes a personal record", async () => {
    const { user } = renderPage(<Training />);
    await user.click(screen.getByRole("tab", { name: "Records personales" }));
    expect(screen.getByText("Sentadilla")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Agregar PR/i }));
    await user.click(screen.getByRole("button", { name: /Guardar PR/i }));
    expect(screen.getByText("Nuevo ejercicio")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "delete" })[0]);
    expect(screen.getByText("Eliminar PR")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(screen.queryByText("Eliminar PR")).not.toBeInTheDocument();
  });
});
