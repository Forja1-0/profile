/**
 * Deeplink al bot de Forja en WhatsApp. El perfil web es para configurar y
 * ver; la acción diaria (loguear comida, reportar sesión) vive en WhatsApp.
 */
const BOT_NUMBER = "5492645127788"; // número del bot Forja (placeholder)

export function waLink(prefill?: string): string {
  const base = `https://wa.me/${BOT_NUMBER}`;
  return prefill ? `${base}?text=${encodeURIComponent(prefill)}` : base;
}

export const waActions = {
  logMeal: waLink("Loguear comida"),
  reportSession: waLink("Reportar sesión"),
  reportSlip: waLink("Reportar desliz"),
  open: waLink(),
};
