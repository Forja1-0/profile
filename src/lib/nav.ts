import { isAmateur } from "./mode";

export type Section = {
  slug: string;
  path: string;
  label: string;
  short: string; // para bottom nav mobile
  icon: string; // Material Symbol
};

/**
 * Definiciones canonicas de TODAS las secciones del producto.
 * Las arrays exportadas (SECTIONS / MOBILE_*) se arman dinamicamente
 * segun FORJA_MODE para esconder las secciones que no aplican al amateur.
 */
const ALL: Record<string, Section> = {
  inicio:        { slug: "inicio", path: "/perfil/inicio", label: "Inicio", short: "Inicio", icon: "today" },
  recordatorios: { slug: "recordatorios", path: "/perfil/recordatorios", label: "Recordatorios", short: "Recordá", icon: "notifications_active" },
  nutricion:     { slug: "nutricion", path: "/perfil/nutricion", label: "Nutrición", short: "Nutrición", icon: "restaurant" },
  entrenamiento: { slug: "entrenamiento", path: "/perfil/entrenamiento", label: "Entrenamiento", short: "Entreno", icon: "fitness_center" },
  salud:         { slug: "salud", path: "/perfil/salud", label: "Salud", short: "Salud", icon: "ecg_heart" },
  journey:       { slug: "journey", path: "/perfil/journey", label: "Journey", short: "Journey", icon: "timeline" },
  configuracion: { slug: "configuracion", path: "/perfil/configuracion", label: "Configuración", short: "Config", icon: "settings" },
  suscripcion:   { slug: "suscripcion", path: "/perfil/suscripcion", label: "Suscripción", short: "Plan", icon: "workspace_premium" },
};

const ELITE_DESKTOP_ORDER = [
  "inicio", "nutricion", "entrenamiento", "salud",
  "journey", "configuracion", "suscripcion",
];

const AMATEUR_DESKTOP_ORDER = [
  "inicio", "recordatorios", "nutricion", "entrenamiento",
  "salud", "configuracion",
];

const order = isAmateur() ? AMATEUR_DESKTOP_ORDER : ELITE_DESKTOP_ORDER;

export const SECTIONS: Section[] = order.map((slug) => ALL[slug]);

const bySlug = (s: string) => ALL[s];

export const MOBILE_PRIMARY: Section[] = isAmateur()
  ? [
      bySlug("inicio"),
      bySlug("recordatorios"),
      bySlug("nutricion"),
      bySlug("entrenamiento"),
    ]
  : [
      bySlug("inicio"),
      bySlug("nutricion"),
      bySlug("entrenamiento"),
      bySlug("salud"),
    ];

export const MOBILE_SECONDARY: Section[] = isAmateur()
  ? [bySlug("salud"), bySlug("configuracion")]
  : [bySlug("journey"), bySlug("configuracion"), bySlug("suscripcion")];
