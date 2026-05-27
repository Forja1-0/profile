// Flag de modo del despliegue del perfil web.
//
// VITE_FORJA_MODE = "amateur" → gym-goer casual (nav simplificado,
//   recordatorios promovidos, sin suscripcion/Journey, Home reescrito).
// VITE_FORJA_MODE = "elite"   → atleta competitivo (comportamiento actual).
//
// El flag se evalua una vez al cargar el bundle. Para alternar hace falta
// cambiar la env del deployment y re-buildear (Vite injecta en build time).

const raw = (import.meta.env.VITE_FORJA_MODE ?? "elite").toLowerCase();
export const FORJA_MODE: "amateur" | "elite" =
  raw === "amateur" ? "amateur" : "elite";

export const isAmateur = (): boolean => FORJA_MODE === "amateur";
export const isElite = (): boolean => FORJA_MODE === "elite";
