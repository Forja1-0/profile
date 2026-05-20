export type Section = {
  slug: string;
  path: string;
  label: string;
  short: string; // para bottom nav mobile
  icon: string; // Material Symbol
};

/**
 * SECTIONS = orden canónico para sidebar (desktop, 7 entradas).
 * MOBILE_PRIMARY = las 4 secciones que viven en la bottom nav.
 * MOBILE_SECONDARY = secciones que se acceden desde el botón "Más".
 *
 * La regla: 5 ítems máx en bottom nav (4 + "Más"). Mantenemos la nav
 * primaria centrada en uso diario; Journey/Config/Plan viven en el drawer.
 */
export const SECTIONS: Section[] = [
  { slug: "inicio", path: "/perfil/inicio", label: "Inicio", short: "Inicio", icon: "today" },
  { slug: "nutricion", path: "/perfil/nutricion", label: "Nutrición", short: "Nutrición", icon: "restaurant" },
  { slug: "entrenamiento", path: "/perfil/entrenamiento", label: "Entrenamiento", short: "Entreno", icon: "fitness_center" },
  { slug: "salud", path: "/perfil/salud", label: "Salud", short: "Salud", icon: "ecg_heart" },
  { slug: "journey", path: "/perfil/journey", label: "Journey", short: "Journey", icon: "timeline" },
  { slug: "configuracion", path: "/perfil/configuracion", label: "Configuración", short: "Config", icon: "settings" },
  { slug: "suscripcion", path: "/perfil/suscripcion", label: "Suscripción", short: "Plan", icon: "workspace_premium" },
];

const bySlug = (s: string) => SECTIONS.find((x) => x.slug === s)!;

export const MOBILE_PRIMARY: Section[] = [
  bySlug("inicio"),
  bySlug("nutricion"),
  bySlug("entrenamiento"),
  bySlug("salud"),
];

export const MOBILE_SECONDARY: Section[] = [
  bySlug("journey"),
  bySlug("configuracion"),
  bySlug("suscripcion"),
];
