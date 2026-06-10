import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { webcrypto } from "node:crypto";

// jsdom doesn't always expose crypto.randomUUID — components use it for new IDs.
if (!globalThis.crypto || typeof globalThis.crypto.randomUUID !== "function") {
  Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
}

// Guard: demo mode must never hit the network. If a fetch slips through, fail loudly.
globalThis.fetch = (() => {
  throw new Error("Network call attempted during test — suite must run in offline demo mode");
}) as typeof fetch;

// jsdom lacks matchMedia; nothing in JS depends on it but keep it safe.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  cleanup();
  // La sesión vive en localStorage; limpiarla para que no se filtre entre tests.
  localStorage.clear();
});
