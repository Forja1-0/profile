import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderPage } from "./helpers";
import { Journey } from "../src/pages/Journey";

describe("Journey", () => {
  it("renders the timeline with totals and events by default", () => {
    renderPage(<Journey />);
    expect(screen.getByRole("tab", { name: "Timeline de eventos" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Nuevo PR: Sentadilla 95 kg")).toBeInTheDocument();
    expect(screen.getByText("Inicio en Forja")).toBeInTheDocument();
    expect(screen.getByText("Streak máx")).toBeInTheDocument();
  });

  it("shows the journey card preview and gallery", async () => {
    const { user } = renderPage(<Journey />);
    await user.click(screen.getByRole("tab", { name: "Journey Cards" }));
    expect(screen.getByText("Galería")).toBeInTheDocument();
    expect(screen.getByText("Semana 13: tu mejor semana hasta hoy.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Descargar PNG/i })).toBeInTheDocument();
  });

  it("shows performance score stats and breakdown", async () => {
    const { user } = renderPage(<Journey />);
    await user.click(screen.getByRole("tab", { name: "Performance Score" }));
    expect(screen.getByText("Score actual")).toBeInTheDocument();
    expect(screen.getByText("Promedio 7d")).toBeInTheDocument();
    expect(screen.getByText(/Adherencia nutricional/i)).toBeInTheDocument();
    expect(screen.getByText(/Top 8%/i)).toBeInTheDocument();
  });
});
