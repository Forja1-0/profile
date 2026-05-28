/**
 * Deeplink al bot de Forja en WhatsApp. El perfil web es para configurar y
 * ver; la accion diaria (loguear comida, reportar sesion) vive en WhatsApp.
 *
 * El numero llega como build arg (VITE_WA_BOT_NUMBER). Si no esta definido,
 * caemos a un placeholder visible y logueamos un warning para que el deploy
 * no se haga sin configurarlo.
 */

const PLACEHOLDER = "5492645295724";
const raw = (import.meta.env.VITE_WA_BOT_NUMBER ?? "").toString().replace(/[^0-9]/g, "");
export const BOT_NUMBER: string = raw || PLACEHOLDER;

if (typeof window !== "undefined" && BOT_NUMBER === PLACEHOLDER) {
  console.warn(
    "[forja] VITE_WA_BOT_NUMBER no esta definido en build — usando placeholder. " +
      "Setealo como build arg en Easypanel.",
  );
}

export function waLink(prefill?: string): string {
  const base = `https://wa.me/${BOT_NUMBER}`;
  return prefill ? `${base}?text=${encodeURIComponent(prefill)}` : base;
}

export const waActions = {
  logMeal: waLink("Loguear comida"),
  reportSession: waLink("Reportar sesion"),
  reportSlip: waLink("Reportar desliz"),
  open: waLink(),
};
