import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderPage } from "./helpers";
import { Home } from "../src/pages/Home";

describe("Home — Inicio / Mi Semana", () => {
  it("greets the athlete and shows today's macros", () => {
    renderPage(<Home />);
    expect(screen.getByText(/Buen día,/i)).toBeInTheDocument();
    expect(screen.getByText("Rocío")).toBeInTheDocument();
    expect(screen.getByText("Kcal")).toBeInTheDocument();
    expect(screen.getByText("Proteína")).toBeInTheDocument();
    expect(screen.getByText("Carbohidratos")).toBeInTheDocument();
    expect(screen.getByText("Grasa")).toBeInTheDocument();
  });

  it("shows the score ring and reveals the breakdown when clicked", async () => {
    const { user } = renderPage(<Home />);
    expect(screen.queryByText(/Desglose del Performance Score/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Ver desglose del score/i }));
    expect(screen.getByText(/Desglose del Performance Score/i)).toBeInTheDocument();
    expect(screen.getByText("Consistencia")).toBeInTheDocument();
  });

  it("renders the race countdown and weekly grid", () => {
    renderPage(<Home />);
    expect(screen.getByText("IRONMAN 5150 San Juan")).toBeInTheDocument();
    expect(screen.getByText(/Semana 14 de 32/i)).toBeInTheDocument();
    expect(screen.getByText(/3\/5 sesiones · 87% nutrición/i)).toBeInTheDocument();
  });

  it("provides contextual WhatsApp actions for the day's session", () => {
    renderPage(<Home />);
    expect(screen.getByText(/Loguear comida/i)).toBeInTheDocument();
    expect(screen.getByText(/Reportar sesión/i)).toBeInTheDocument();
  });
});
