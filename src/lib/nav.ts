export type Section = {
  slug: string;
  path: string;
  label: string;
  short: string; // para bottom nav mobile
  icon: string; // Material Symbol
};

export const SECTIONS: Section[] = [
  { slug: "inicio", path: "/perfil/inicio", label: "Inicio / Mi Semana", short: "Inicio", icon: "today" },
  { slug: "nutricion", path: "/perfil/nutricion", label: "Nutrición", short: "Nutrición", icon: "restaurant" },
  { slug: "entrenamiento", path: "/perfil/entrenamiento", label: "Entrenamiento", short: "Entreno", icon: "fitness_center" },
  { slug: "salud", path: "/perfil/salud", label: "Salud y Cuerpo", short: "Salud", icon: "ecg_heart" },
  { slug: "journey", path: "/perfil/journey", label: "Journey", short: "Journey", icon: "timeline" },
  { slug: "configuracion", path: "/perfil/configuracion", label: "Configuración", short: "Config", icon: "settings" },
  { slug: "suscripcion", path: "/perfil/suscripcion", label: "Suscripción", short: "Plan", icon: "workspace_premium" },
];
