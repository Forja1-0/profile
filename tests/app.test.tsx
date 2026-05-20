import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../src/App";

describe("App shell — routing, layout & navigation", () => {
  it("redirects the root path to the Inicio page", () => {
    render(<App />);
    expect(screen.getByText(/Buen día,/i)).toBeInTheDocument();
  });

  it("renders the demo status banner (offline mode)", () => {
    render(<App />);
    expect(
      screen.getByText(/Modo demo · seteá VITE_API_URL y VITE_USER_ID/i),
    ).toBeInTheDocument();
  });

  it("renders every section in the navigation (sidebar + bottom nav)", () => {
    render(<App />);
    for (const label of [/Nutrición/i, /Entreno/i, /Salud/i, /Journey/i, /Config/i, /Plan/i]) {
      expect(screen.getAllByRole("link", { name: label }).length).toBeGreaterThan(0);
    }
  });

  it("exposes WhatsApp entry points", () => {
    render(<App />);
    const waLinks = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href")?.includes("wa.me") || /whatsapp/i.test(a.textContent ?? ""));
    expect(waLinks.length).toBeGreaterThan(0);
  });

  it("renders the legal disclaimer footer", () => {
    render(<App />);
    expect(
      screen.getByText(/Forja no constituye asesoramiento médico/i),
    ).toBeInTheDocument();
  });

  it("navigates to another section when a nav link is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);
    const nutritionLink = screen.getAllByRole("link", { name: /Nutrición/i })[0];
    await user.click(nutritionLink);
    expect(await screen.findByText(/El corazón del tracking/i)).toBeInTheDocument();
  });

  it("keeps the mobile bottom nav present in the DOM", () => {
    render(<App />);
    // Bottom nav uses short labels; "Entreno" only exists there.
    const bottomTab = screen.getByRole("link", { name: /Entreno/i });
    expect(bottomTab).toBeInTheDocument();
    within(bottomTab).getByText("Entreno");
  });
});
