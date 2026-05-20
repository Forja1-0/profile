import { describe, it, expect } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderPage } from "./helpers";
import { Nutrition } from "../src/pages/Nutrition";

describe("Nutrition", () => {
  it("renders tabs and the frequent-meals list by default", () => {
    renderPage(<Nutrition />);
    expect(screen.getByRole("tab", { name: "Comidas frecuentes" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(/5\/10 comidas frecuentes/i)).toBeInTheDocument();
    expect(screen.getByText(/Desayuno 1 — Huevos \+ tostadas/i)).toBeInTheDocument();
  });

  it("creates a new frequent meal end-to-end", async () => {
    const { user } = renderPage(<Nutrition />);
    await user.click(screen.getByRole("button", { name: /Nueva comida/i }));

    expect(screen.getByText("Nueva comida frecuente")).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText(/Ej: Desayuno 1/i), "Test Meal");

    const search = screen.getByPlaceholderText(/Buscar \(modo demo\)/i);
    await user.type(search, "pollo");
    await user.click(await screen.findByRole("button", { name: /Pechuga de pollo/i }));

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(screen.queryByText("Nueva comida frecuente")).not.toBeInTheDocument();
    expect(screen.getByText(/6\/10 comidas frecuentes/i)).toBeInTheDocument();
    expect(screen.getByText(/Desayuno 2 — Test Meal/i)).toBeInTheDocument();
  });

  it("deletes a frequent meal through the confirm dialog", async () => {
    const { user } = renderPage(<Nutrition />);
    await user.click(screen.getAllByTitle("Eliminar")[0]);

    const dialog = screen.getByText("Eliminar comida frecuente").closest("div")!;
    expect(dialog).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(screen.getByText(/4\/10 comidas frecuentes/i)).toBeInTheDocument();
  });

  it("edits macro targets from the plan tab", async () => {
    const { user } = renderPage(<Nutrition />);
    await user.click(screen.getByRole("tab", { name: "Plan nutricional" }));
    expect(screen.getByText("150 g")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Editar macros/i }));
    const proteinInput = screen.getByDisplayValue("150");
    await user.clear(proteinInput);
    await user.type(proteinInput, "165");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(screen.getByText("165 g")).toBeInTheDocument();
  });

  it("shows restrictions and disables saving in demo mode", async () => {
    const { user } = renderPage(<Nutrition />);
    await user.click(screen.getByRole("tab", { name: "Restricciones" }));
    expect(screen.getByText("Intolerancia a lactosa")).toBeInTheDocument();
    expect(screen.getByText("Celíaco")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Guardar cambios/i })).toBeDisabled();
    expect(screen.getByText(/Guardar requiere conexión al backend/i)).toBeInTheDocument();
  });

  it("switches macro and range filters in the history tab", async () => {
    const { user } = renderPage(<Nutrition />);
    await user.click(screen.getByRole("tab", { name: "Historial" }));
    expect(screen.getByText(/Kcal — consumido vs\. target/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "P" }));
    expect(screen.getByText(/Proteína — consumido vs\. target/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "7 días" }));
    expect(within(screen.getByRole("table")).getAllByRole("row").length).toBeGreaterThan(1);
  });
});
