/**
 * Mock dataset del atleta. Un solo usuario coherente para que todas las
 * pantallas del perfil cuenten la misma historia (la "historia irrecuperable"
 * de la que habla el spec). Sin backend: esto es el contrato de datos que
 * la capa /api real tendría que devolver.
 */

export type DayState = "done" | "skipped" | "rest" | "future" | "today";
export type SessionType = "gym" | "swim" | "bike" | "run" | "rest";
export type Plan = "toyota" | "audi" | "ferrari";

export const athlete = {
  name: "Rocío Mendoza",
  firstName: "Rocío",
  age: 31,
  sex: "Femenino",
  email: "rocio.mendoza@gmail.com",
  phone: "+54 9 264 512 7788",
  plan: "audi" as Plan,
  profileCompleteness: 78,
  memberSince: "2026-02-08",
};

export const race = {
  name: "IRONMAN 5150 San Juan",
  date: "2026-10-30",
  weekCurrent: 14,
  weekTotal: 32,
};

export const today = {
  date: "2026-05-16",
  score: 82,
  macros: {
    kcal: { value: 1840, target: 2200 },
    protein: { value: 128, target: 150 },
    carbs: { value: 196, target: 250 },
    fat: { value: 58, target: 70 },
  },
  session: {
    type: "bike" as SessionType,
    title: "Bici Z2 — Rodaje 90'",
    time: "12:00",
    status: "pending" as "pending" | "done" | "skipped",
    rpe: null as number | null,
  },
  scoreBreakdown: { nutrition: 38, training: 30, consistency: 14 }, // suma 82
};

export const week: { day: string; state: DayState; label: string }[] = [
  { day: "Lun", state: "done", label: "Natación · RPE 6" },
  { day: "Mar", state: "done", label: "Gym piernas A · RPE 8" },
  { day: "Mié", state: "skipped", label: "Corrida saltada" },
  { day: "Jue", state: "done", label: "Bici Z2 · RPE 5" },
  { day: "Vie", state: "today", label: "Bici Z2 — Rodaje 90'" },
  { day: "Sáb", state: "future", label: "Ladrillo bici+corrida" },
  { day: "Dom", state: "rest", label: "Descanso" },
];

export const weekSummary = { sessionsDone: 3, sessionsPlanned: 5, nutritionPct: 87 };

export const streaks = [
  { icon: "local_fire_department", text: "7 días consecutivos con nutrición >90%", tone: "green" },
  { icon: "trophy", text: "Nuevo PR: sentadilla 95 kg", tone: "gold" },
  { icon: "bolt", text: "Semana 13 cerrada con score 91", tone: "green" },
];

/* ---------- Nutrición ---------- */
export type Ingredient = { name: string; grams: number; p: number; c: number; f: number; kcal: number };
export type FrequentMeal = {
  id: string;
  name: string;
  daypart: "Desayuno" | "Almuerzo" | "Merienda" | "Cena" | "Snack";
  ingredients: Ingredient[];
  uses30d: number;
};

export const frequentMeals: FrequentMeal[] = [
  {
    id: "m1", name: "Desayuno 1 — Huevos + tostadas", daypart: "Desayuno", uses30d: 18,
    ingredients: [
      { name: "Huevo entero", grams: 120, p: 15, c: 1, f: 13, kcal: 186 },
      { name: "Pan integral", grams: 60, p: 6, c: 30, f: 2, kcal: 162 },
      { name: "Palta", grams: 50, p: 1, c: 4, f: 7, kcal: 80 },
    ],
  },
  {
    id: "m2", name: "Almuerzo 1 — Pollo + arroz", daypart: "Almuerzo", uses30d: 22,
    ingredients: [
      { name: "Pechuga de pollo", grams: 200, p: 46, c: 0, f: 6, kcal: 240 },
      { name: "Arroz blanco cocido", grams: 180, p: 5, c: 50, f: 1, kcal: 232 },
      { name: "Ensalada mixta", grams: 120, p: 2, c: 6, f: 4, kcal: 60 },
    ],
  },
  {
    id: "m3", name: "Merienda 1 — Yogur + granola", daypart: "Merienda", uses30d: 12,
    ingredients: [
      { name: "Yogur descremado", grams: 200, p: 12, c: 14, f: 2, kcal: 130 },
      { name: "Granola", grams: 40, p: 4, c: 26, f: 6, kcal: 178 },
    ],
  },
  {
    id: "m4", name: "Cena 1 — Salmón + puré", daypart: "Cena", uses30d: 9,
    ingredients: [
      { name: "Salmón", grams: 180, p: 39, c: 0, f: 22, kcal: 360 },
      { name: "Puré de papa", grams: 200, p: 4, c: 30, f: 5, kcal: 175 },
    ],
  },
  {
    id: "m5", name: "Snack 1 — Banana + maní", daypart: "Snack", uses30d: 7,
    ingredients: [
      { name: "Banana", grams: 120, p: 1, c: 27, f: 0, kcal: 110 },
      { name: "Maní", grams: 30, p: 8, c: 5, f: 14, kcal: 170 },
    ],
  },
];

export const nutritionPlan = {
  protein: 150, carbs: 250, fat: 70, kcal: 2200,
  nutritionist: "Lic. Marina Quiroga",
  hasPdf: true,
  history: [
    { from: "2026-02-08", to: "2026-04-01", label: "Plan base — recomposición" },
    { from: "2026-04-01", to: "actual", label: "Plan carga — pre-IRONMAN" },
  ],
};

export const restrictions = [
  { id: "lactose", label: "Intolerancia a lactosa", active: true },
  { id: "pork", label: "No come cerdo", active: true },
  { id: "beef", label: "No carne vacuna", active: false },
  { id: "chicken", label: "No pollo", active: false },
  { id: "fish", label: "No pescado", active: false },
  { id: "egg", label: "No huevo", active: false },
  { id: "celiac", label: "Celíaco", active: false },
  { id: "vegan", label: "Vegano", active: false },
  { id: "vegetarian", label: "Vegetariano", active: false },
];

// Historial nutricional — 14 días (kcal/p/c/f vs target)
export const nutritionHistory = Array.from({ length: 14 }).map((_, i) => {
  const day = 16 - (13 - i);
  const drift = Math.sin(i * 0.9) * 180;
  const kcal = Math.round(2080 + drift + (i % 4 === 0 ? -260 : 60));
  return {
    date: `2026-05-${String(day).padStart(2, "0")}`,
    kcal, target: 2200,
    p: Math.round(132 + Math.sin(i) * 14),
    c: Math.round(228 + Math.cos(i) * 26),
    f: Math.round(64 + Math.sin(i * 1.4) * 8),
    adherence: Math.max(62, Math.min(99, Math.round(88 + Math.sin(i * 1.3) * 12))),
  };
});

/* ---------- Entrenamiento ---------- */
export const weeklyPlan: {
  day: string; type: SessionType; desc: string; time: string; mandatory: boolean;
}[] = [
  { day: "Lunes", type: "swim", desc: "Natación técnica 2.000 m", time: "07:00", mandatory: true },
  { day: "Martes", type: "gym", desc: "Gym — Piernas A (fuerza)", time: "12:00", mandatory: true },
  { day: "Miércoles", type: "run", desc: "Corrida Z2 8 km", time: "18:30", mandatory: false },
  { day: "Jueves", type: "bike", desc: "Bici Z2 60'", time: "12:00", mandatory: true },
  { day: "Viernes", type: "bike", desc: "Bici Z2 — Rodaje 90'", time: "12:00", mandatory: true },
  { day: "Sábado", type: "bike", desc: "Ladrillo: bici 2 h + corrida 20'", time: "08:00", mandatory: true },
  { day: "Domingo", type: "rest", desc: "Descanso activo / movilidad", time: "—", mandatory: false },
];

export const sessionHistory = [
  { date: "2026-05-15", type: "bike" as SessionType, status: "done", rpe: 5, note: "" },
  { date: "2026-05-14", type: "run" as SessionType, status: "skipped", rpe: null, note: "Acorté por lluvia" },
  { date: "2026-05-13", type: "gym" as SessionType, status: "done", rpe: 8, note: "PR sentadilla 95 kg" },
  { date: "2026-05-12", type: "swim" as SessionType, status: "done", rpe: 6, note: "" },
  { date: "2026-05-11", type: "bike" as SessionType, status: "done", rpe: 7, note: "Molestia leve rodilla der." },
  { date: "2026-05-10", type: "bike" as SessionType, status: "done", rpe: 6, note: "Ladrillo completo" },
  { date: "2026-05-09", type: "run" as SessionType, status: "done", rpe: 5, note: "" },
];

export const sessionStats = { done: 187, planned: 192, rate: 97.4, avgRpe: 6.3 };

export const personalRecords = [
  { id: "pr1", exercise: "Sentadilla", mark: "95 kg", date: "2026-05-13" },
  { id: "pr2", exercise: "Peso muerto", mark: "120 kg", date: "2026-04-22" },
  { id: "pr3", exercise: "5 km corrida", mark: "24:18", date: "2026-04-09" },
  { id: "pr4", exercise: "1.500 m natación", mark: "31:40", date: "2026-03-30" },
];

/* ---------- Salud y cuerpo ---------- */
export const bodyData = {
  heightCm: 168,
  currentWeight: 62.4,
  bodyFat: 21.5,
  weightHistory: [
    { date: "2026-02-15", kg: 65.8 }, { date: "2026-03-01", kg: 65.1 },
    { date: "2026-03-15", kg: 64.4 }, { date: "2026-04-01", kg: 63.7 },
    { date: "2026-04-15", kg: 63.2 }, { date: "2026-05-01", kg: 62.8 },
    { date: "2026-05-15", kg: 62.4 },
  ],
};

export const activeInjuries = [
  {
    id: "inj1", area: "Aquiles derecho", desc: "Tendinopatía leve por sobrecarga",
    pain: 3, since: "2026-04-28", treatment: true, treatmentDesc: "Kinesiología 2x semana + excéntricos",
    painHistory: [
      { date: "2026-04-28", v: 6 }, { date: "2026-05-03", v: 5 },
      { date: "2026-05-08", v: 4 }, { date: "2026-05-13", v: 3 },
    ],
  },
];

export const pastInjuries = [
  { id: "p1", area: "Rodilla izquierda", from: "2026-01-10", to: "2026-03-02", days: 51 },
  { id: "p2", area: "Lumbar", from: "2025-11-05", to: "2025-12-01", days: 26 },
];

export const chronic = ["Asma leve (ejercicio-inducida)"];
export const medication = [{ name: "Salbutamol", dose: "100 mcg", when: "Pre-entreno si necesario" }];
export const allergies = ["Frutos secos (leve)"];

export const clinicalDocs = [
  { id: "d1", type: "Electrocardiograma", date: "2026-02-05", size: "1.2 MB", isImage: false },
  { id: "d2", type: "Apto médico deportivo", date: "2026-02-06", size: "640 KB", isImage: false },
  { id: "d3", type: "Análisis de sangre", date: "2026-04-18", size: "880 KB", isImage: false },
  { id: "d4", type: "Ecografía aquiles", date: "2026-04-29", size: "2.1 MB", isImage: true },
];

/* ---------- Journey ---------- */
export type TLKind = "injury" | "slip" | "pr" | "milestone" | "planchange" | "highweek";
export const timeline: { date: string; kind: TLKind; title: string; detail: string }[] = [
  { date: "2026-05-13", kind: "pr", title: "Nuevo PR: Sentadilla 95 kg", detail: "+5 kg sobre marca anterior" },
  { date: "2026-05-11", kind: "highweek", title: "Semana 13 · Score 91", detail: "5/5 sesiones · 94% nutrición" },
  { date: "2026-05-04", kind: "slip", title: "Desliz reportado", detail: "Cumpleaños — pizza + cerveza. Recuperado al día siguiente." },
  { date: "2026-04-29", kind: "injury", title: "Lesión: Aquiles derecho", detail: "Tendinopatía leve. Dolor inicial 6/10." },
  { date: "2026-04-01", kind: "planchange", title: "Nuevo plan nutricional", detail: "Plan carga pre-IRONMAN — Lic. Marina Quiroga" },
  { date: "2026-03-30", kind: "pr", title: "Nuevo PR: 1.500 m natación 31:40", detail: "Primera vez bajo 32'" },
  { date: "2026-03-02", kind: "milestone", title: "Lesión superada: Rodilla izq.", detail: "51 días. Vuelta progresiva completada." },
  { date: "2026-02-15", kind: "milestone", title: "Primera semana perfecta", detail: "100% sesiones · 96% nutrición" },
  { date: "2026-02-08", kind: "milestone", title: "Inicio en Forja", detail: "Objetivo: IRONMAN 5150 San Juan" },
];

export const journeyCards = [
  { id: "jc14", kind: "Semanal", week: 14, title: "Semana 14: el aquiles cede, vos no.", date: "2026-05-11" },
  { id: "jc13", kind: "Semanal", week: 13, title: "Semana 13: tu mejor semana hasta hoy.", date: "2026-05-04" },
  { id: "jc12", kind: "Semanal", week: 12, title: "Semana 12: volviste de la lesión.", date: "2026-04-27" },
  { id: "jc11", kind: "Semanal", week: 11, title: "Semana 11: disciplina en silencio.", date: "2026-04-20" },
];

export const scoreSeries = [
  74, 78, 71, 83, 80, 88, 85, 79, 91, 87, 82, 90, 86, 82,
];
export const scoreStats = { current: 82, avg7: 86, avg30: 83, avg90: 80, percentile: 8 };

export const journeyTotals = {
  sessions: 187, mealsLogged: 642, maxStreak: 23,
  prs: 4, injuriesBeat: 2, slipsRecovered: 5, weeksOver90: 6,
};

/* ---------- Configuración ---------- */
export const reminders = [
  { id: "r1", label: "Recordatorio matutino", sub: "Qué sesión toca hoy", time: "06:00", on: true },
  { id: "r2", label: "Recordatorio almuerzo", sub: "¿Ya almorzaste?", time: "13:00", on: true },
  { id: "r3", label: "Recordatorio merienda", sub: "¿Ya merendaste?", time: "17:00", on: false },
  { id: "r4", label: "Resumen nocturno", sub: "Balance del día", time: "21:00", on: true },
  { id: "r5", label: "Alerta de no-cumplimiento", sub: "Si kcal <85% del target", time: "22:30", on: true },
  { id: "r6", label: "Resumen semanal + Journey Card", sub: "Domingos", time: "20:00", on: true },
];
export const customReminders = [{ id: "c1", time: "15:00", msg: "Tomar creatina" }];
export const quietHours = { from: "23:00", to: "06:00" };
export const botTone = "rocky" as "rocky" | "analytic" | "empathic";

/* ---------- Suscripción ---------- */
export const subscription = {
  plan: "audi" as Plan,
  since: "2026-02-08",
  nextCharge: "2026-06-08",
  amount: "$14.99",
  card: { brand: "Visa", last4: "4242" },
  payments: [
    { date: "2026-05-08", amount: "$14.99", status: "Pagado" },
    { date: "2026-04-08", amount: "$14.99", status: "Pagado" },
    { date: "2026-03-08", amount: "$14.99", status: "Pagado" },
    { date: "2026-02-08", amount: "$0.00", status: "Trial" },
  ],
  referral: { code: "ROCIO-FORJA", invited: 4, converted: 2 },
};

export const planMatrix: { feature: string; toyota: boolean | string; audi: boolean | string; ferrari: boolean | string }[] = [
  { feature: "Bot WhatsApp con 3 modos de captura", toyota: true, audi: true, ferrari: true },
  { feature: "Comidas frecuentes ilimitadas", toyota: true, audi: true, ferrari: true },
  { feature: "Performance Score", toyota: true, audi: true, ferrari: true },
  { feature: "Recordatorio matutino + nocturno", toyota: true, audi: true, ferrari: true },
  { feature: "Journey Card semanal", toyota: true, audi: true, ferrari: true },
  { feature: "Detección de deslices con AI", toyota: false, audi: true, ferrari: true },
  { feature: "Journey Card de víspera de carrera", toyota: false, audi: true, ferrari: true },
  { feature: "Personalización de alertas avanzada", toyota: false, audi: true, ferrari: true },
  { feature: "Dashboard completo con historial", toyota: false, audi: true, ferrari: true },
  { feature: "Percentil de comunidad", toyota: false, audi: true, ferrari: true },
  { feature: "Integración wearables (Garmin/WHOOP)", toyota: false, audi: false, ferrari: true },
  { feature: "Leaderboard de adherencia", toyota: false, audi: false, ferrari: true },
  { feature: "Modo coach (vista de equipo)", toyota: false, audi: false, ferrari: true },
  { feature: "Invites para otros atletas", toyota: false, audi: false, ferrari: "3/mes" },
  { feature: "Soporte prioritario", toyota: false, audi: false, ferrari: true },
];

/* Tabla de ~500 alimentos argentinos — muestra para el autocompletado */
export const foodTable: Omit<Ingredient, "grams">[] = [
  { name: "Pechuga de pollo", p: 23, c: 0, f: 3, kcal: 120 },
  { name: "Huevo entero", p: 13, c: 1, f: 11, kcal: 155 },
  { name: "Arroz blanco cocido", p: 2.7, c: 28, f: 0.3, kcal: 130 },
  { name: "Avena", p: 13, c: 67, f: 7, kcal: 389 },
  { name: "Banana", p: 1.1, c: 23, f: 0.3, kcal: 89 },
  { name: "Palta", p: 2, c: 9, f: 15, kcal: 160 },
  { name: "Yogur descremado", p: 6, c: 7, f: 1, kcal: 63 },
  { name: "Pan integral", p: 9, c: 49, f: 3, kcal: 247 },
  { name: "Salmón", p: 20, c: 0, f: 13, kcal: 208 },
  { name: "Lentejas cocidas", p: 9, c: 20, f: 0.4, kcal: 116 },
  { name: "Batata", p: 1.6, c: 20, f: 0.1, kcal: 86 },
  { name: "Carne vacuna magra", p: 26, c: 0, f: 8, kcal: 187 },
  { name: "Atún al natural", p: 26, c: 0, f: 1, kcal: 116 },
  { name: "Queso port salut", p: 24, c: 2, f: 26, kcal: 340 },
  { name: "Manzana", p: 0.3, c: 14, f: 0.2, kcal: 52 },
  { name: "Maní", p: 26, c: 16, f: 49, kcal: 567 },
];
