import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderPage } from "./helpers";
import { Subscription } from "../src/pages/Subscription";

describe("Subscription", () => {
  it("shows the current plan, payment history and a cancel flow", async () => {
    const { user } = renderPage(<Subscription />);
    expect(screen.getByText("Plan Audi")).toBeInTheDocument();
    expect(screen.getByText(/Visa ···· 4242/i)).toBeInTheDocument();
    expect(screen.getByText("Historial de pagos")).toBeInTheDocument();
    expect(screen.getByText("2026-05-08")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByText(/Cancelar suscripción · paso 1 de 2/i)).toBeInTheDocument();
  });

  it("compares plans in a feature matrix", async () => {
    const { user } = renderPage(<Subscription />);
    await user.click(screen.getByRole("tab", { name: "Comparar planes" }));
    expect(screen.getByText("Tu plan")).toBeInTheDocument();
    expect(screen.getByText("Performance Score")).toBeInTheDocument();
    expect(screen.getByText(/Detección de deslices con AI/i)).toBeInTheDocument();
  });

  it("shows the referral link and stats", async () => {
    const { user } = renderPage(<Subscription />);
    await user.click(screen.getByRole("tab", { name: "Referidos" }));
    expect(screen.getByDisplayValue("forja.app/r/ROCIO-FORJA")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Copiar/i })).toBeInTheDocument();
    expect(screen.getByText("Referidas")).toBeInTheDocument();
    expect(screen.getByText("Activas (30d+)")).toBeInTheDocument();
  });
});
