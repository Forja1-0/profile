/**
 * Mapea las respuestas del backend (schema canónico) a las MISMAS formas que
 * usa la UI (las definidas en data/mock.ts). Así las páginas no cambian: solo
 * cambia la fuente de los datos (live vs demo).
 *
 * Donde la Fase Toyota no modela algo (histórico de peso, evolución de dolor,
 * momento del día de una comida) derivamos lo razonable a partir de lo que
 * la DB sí tiene, sin inventar columnas.
 */
import type {
  DbOverview, DbNutrition, DbTraining, DbHealth, DbJourney, DbFrequentMeal, DbProfileIdentity,
} from "./client";
import * as mock from "../data/mock";

const DOW = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DOW_FULL = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const SESSION_MAP: Record<string, mock.SessionType> = {
  gym: "gym", funcional: "gym", crossfit: "gym",
  natacion: "swim", swim: "swim",
  bici: "bike", bike: "bike", ciclismo: "bike",
  corrida: "run", run: "run", running: "run",
  descanso: "rest", rest: "rest", yoga: "rest",
};
const st = (s: string | null | undefined): mock.SessionType => SESSION_MAP[(s ?? "").toLowerCase()] ?? "gym";

function weeksBetween(a: string, b: string) {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 6.048e8));
}
function dayParts(alias: string): mock.FrequentMeal["daypart"] {
  const a = alias.toLowerCase();
  if (a.includes("desayuno")) return "Desayuno";
  if (a.includes("almuerzo")) return "Almuerzo";
  if (a.includes("merienda")) return "Merienda";
  if (a.includes("cena")) return "Cena";
  return "Snack";
}

export function mealFromDb(m: DbFrequentMeal): mock.FrequentMeal {
  return {
    id: m.id,
    name: m.alias,
    daypart: dayParts(m.alias),
    uses30d: m.use_count,
    ingredients: (m.ingredients ?? []).map((x) => ({
      name: x.name, grams: x.grams, p: x.protein, c: x.carbs, f: x.fat, kcal: x.kcal,
    })),
  };
}
export function mealToPayload(m: mock.FrequentMeal) {
  return {
    alias: m.name,
    ingredients: m.ingredients.map((i) => ({
      name: i.name, grams: i.grams, kcal: i.kcal, protein: i.p, carbs: i.c, fat: i.f,
    })),
  };
}

/* UI restriction id → columna DB (inverso del map de buildNutrition). */
export const RESTRICTION_UI_TO_DB: Record<string, string> = {
  lactose: "lactose_intolerant", pork: "no_pork", beef: "no_beef",
  chicken: "no_chicken", fish: "no_fish", egg: "no_eggs",
  celiac: "celiac", vegan: "vegan", vegetarian: "vegetarian",
};

/** Lista de restricciones de la UI → objeto flags con claves de columna DB. */
export function restrictionsToFlags(list: typeof mock.restrictions): Record<string, boolean> {
  const flags: Record<string, boolean> = {};
  for (const r of list) {
    const col = RESTRICTION_UI_TO_DB[r.id];
    if (col) flags[col] = r.active;
  }
  return flags;
}

/** Lesión activa de la UI → shape JSONB del schema (medical_history.active_injuries). */
export function injuryToDb(i: {
  area: string; desc: string; pain: number; since: string;
  treatment: boolean; treatmentDesc: string;
}) {
  return {
    location: i.area,
    description: i.desc,
    pain_level: i.pain,
    start_date: i.since,
    in_treatment: i.treatment,
    treatment: i.treatmentDesc,
  };
}

/**
 * Texto humano para la meta personal del usuario amateur. Combina goal_kind
 * + metric_value + unit + label de forma legible. Devuelve null si no hay
 * meta cargada (Home la trata como "todavia no pusiste una").
 */
function formatPersonalGoal(g: DbOverview["goal"]): string | null {
  if (!g) return null;
  // Meta libre con texto custom.
  if (g.goal_metric_label && g.goal_metric_label.trim()) return g.goal_metric_label.trim();
  const value = g.goal_metric_value;
  const unit = g.goal_metric_unit;
  switch (g.goal_kind) {
    case "lose_weight":
      return value && unit ? `Bajar ${value} ${unit}` : "Bajar de peso";
    case "gain_muscle":
      return value && unit ? `Sumar ${value} ${unit} de masa` : "Ganar masa muscular";
    case "improve_time":
      return value && unit ? `Mejorar tiempo a ${value} ${unit}` : "Mejorar mi tiempo";
    case "reach_distance":
      return value && unit ? `Llegar a ${value} ${unit}` : "Aumentar distancia";
    default:
      break;
  }
  // Meta elite tradicional (carrera/evento): caemos al event_name.
  return g.event_name ?? null;
}

export function buildHome(id: DbProfileIdentity, o: DbOverview) {
  const personalGoal = formatPersonalGoal(o.goal);
  const athlete = {
    ...mock.athlete,
    name: id.name,
    firstName: id.name.split(" ")[0],
    age: id.age,
    sex: id.sex === "F" ? "Femenino" : id.sex === "M" ? "Masculino" : "X",
    email: id.email,
    phone: id.phone_wa,
    memberSince: id.member_since?.slice(0, 10) ?? mock.athlete.memberSince,
    // En modo live, personalGoal viene del backend. Si no hay meta cargada,
    // el componente HomeAmateur muestra el placeholder de "ponete una meta".
    personalGoal: personalGoal ?? null,
  };

  // El race solo aplica al modo elite (objetivo competitivo con fecha).
  // Para amateur el goal puede no tener event_date — en ese caso nos
  // quedamos con el mock para no romper la UI elite.
  const race = o.goal && o.goal.event_date
    ? {
        name: o.goal.event_name ?? "Tu objetivo",
        date: o.goal.event_date,
        weekTotal: weeksBetween(o.goal.created_at, o.goal.event_date),
        weekCurrent: Math.min(
          weeksBetween(o.goal.created_at, o.goal.event_date),
          weeksBetween(o.goal.created_at, new Date().toISOString()),
        ),
      }
    : mock.race;

  const rem = o.remaining;
  const today = {
    ...mock.today,
    score: o.summaries[0]?.performance_score ?? mock.today.score,
    macros: rem
      ? {
          kcal: { value: Math.round(rem.consumed_kcal), target: rem.target_kcal },
          protein: { value: Math.round(rem.consumed_protein), target: rem.target_protein_g },
          carbs: { value: Math.round(rem.consumed_carbs), target: rem.target_carbs_g },
          fat: { value: Math.round(rem.consumed_fat), target: rem.target_fat_g },
        }
      : mock.today.macros,
    session: o.todayTraining
      ? {
          type: st(o.todayTraining.session_type),
          title: o.todayTraining.session_name ?? o.todayTraining.session_type,
          time: (o.todayTraining.approx_time ?? "").slice(0, 5) || "—",
          status: "pending" as const,
          rpe: null,
        }
      : mock.today.session,
  };

  const byDate = new Map(o.summaries.map((s) => [s.summary_date.slice(0, 10), s]));
  const week = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const s = byDate.get(key);
    const isToday = i === 6;
    let state: mock.DayState = "future";
    if (s) state = s.training_completed ? "done" : "skipped";
    if (isToday) state = "today";
    return { day: DOW[d.getDay()], state, label: s ? `Score ${s.performance_score ?? "—"}` : "—" };
  });

  const doneN = o.trainingLogs.filter((l) => l.completed).length;
  // Planeadas = filas activas en training_plans (no-rest). Si no hay plan,
  // caemos a la cantidad logueada para no mostrar "X de 0".
  const planned = o.weekSessionsPlanned || o.trainingLogs.length || 0;
  const weekSummary = {
    sessionsDone: doneN,
    sessionsPlanned: planned,
    // Promedio real de adherencia de la semana, no el de hoy. Si el backend
    // no devolvio nada (sin summaries en 7d), volvemos al mock.
    nutritionPct: o.monthly?.nutritionPct7d ?? Math.round(o.summaries[0]?.kcal_adherence_pct ?? mock.weekSummary.nutritionPct),
  };

  const monthly = {
    sessionsDone: o.monthly?.sessionsDone30d ?? 0,
    nutritionPct: o.monthly?.nutritionPct30d ?? null,
  };

  const streaks = o.events.slice(0, 3).map((e) => ({
    icon: e.event_type === "pr" ? "trophy" : e.event_type === "milestone" ? "bolt" : "local_fire_department",
    text: e.description,
    tone: e.event_type === "pr" ? "gold" : "green",
  }));

  return { athlete, race, today, week, weekSummary, monthly, streaks };
}

export function buildNutrition(n: DbNutrition) {
  const nutritionPlan = n.active
    ? {
        protein: n.active.target_protein_g,
        carbs: n.active.target_carbs_g,
        fat: n.active.target_fat_g,
        kcal: n.active.target_kcal,
        nutritionist: n.active.nutritionist_name ?? "—",
        hasPdf: !!n.active.plan_file_url,
        history: n.history.map((h) => ({
          from: h.created_at.slice(0, 10),
          to: h.is_active ? "actual" : "—",
          label: h.nutritionist_name ? `Plan — ${h.nutritionist_name}` : `Plan ${h.target_kcal} kcal`,
        })),
      }
    : mock.nutritionPlan;

  const r = n.restrictions;
  const map: Record<string, string> = {
    lactose_intolerant: "lactose", no_pork: "pork", no_beef: "beef", no_chicken: "chicken",
    no_fish: "fish", no_eggs: "egg", celiac: "celiac", vegan: "vegan", vegetarian: "vegetarian",
  };
  const restrictions = r
    ? mock.restrictions.map((m) => {
        const dbKey = Object.entries(map).find(([, v]) => v === m.id)?.[0];
        return { ...m, active: dbKey ? Boolean(r[dbKey]) : m.active };
      })
    : mock.restrictions;

  const nutritionHistory = n.summaries.map((s) => ({
    date: s.summary_date.slice(0, 10),
    kcal: s.total_kcal,
    target: nutritionPlan.kcal,
    p: Math.round(s.total_protein_g),
    c: Math.round(s.total_carbs_g),
    f: Math.round(s.total_fat_g),
    adherence: Math.round(s.kcal_adherence_pct ?? 0),
  }));

  return { nutritionPlan, restrictions, nutritionHistory };
}

export function buildTraining(t: DbTraining) {
  const weeklyPlan = t.plan.length
    ? Array.from({ length: 7 }).map((_, dow) => {
        const row = t.plan.find((p) => p.day_of_week === dow);
        return row
          ? {
              day: DOW_FULL[dow],
              type: st(row.session_type),
              desc: row.session_name ?? row.session_type,
              time: (row.approx_time ?? "").slice(0, 5) || "—",
              mandatory: true,
            }
          : { day: DOW_FULL[dow], type: "rest" as mock.SessionType, desc: "Descanso", time: "—", mandatory: false };
      })
    : mock.weeklyPlan;

  const sessionHistory = t.logs.slice(0, 12).map((l) => ({
    date: l.logged_at.slice(0, 10),
    type: st(l.session_name),
    status: l.completed ? "done" : "skipped",
    rpe: l.rpe,
    note: l.notes ?? l.modifications ?? "",
  }));

  const sessionStats = {
    done: t.stats.done,
    planned: t.stats.planned,
    rate: t.stats.rate,
    avgRpe: t.stats.avgRpe ?? 0,
  };

  const personalRecords = t.prs.map((p) => {
    const ctx = (p.context ?? {}) as { mark?: string };
    return { id: p.id, exercise: p.description, mark: ctx.mark ?? "—", date: p.occurred_at.slice(0, 10) };
  });

  return { weeklyPlan, sessionHistory, sessionStats, personalRecords };
}

export function buildHealth(h: DbHealth) {
  const b = h.body;
  const bodyData = b
    ? {
        heightCm: b.height_cm,
        currentWeight: b.weight_kg,
        bodyFat: b.body_fat_pct ?? 0,
        weightHistory: [{ date: b.updated_at.slice(0, 10), kg: b.weight_kg }],
      }
    : { heightCm: 0, currentWeight: 0, bodyFat: 0, weightHistory: [] as { date: string; kg: number }[] };

  const med = h.medical;
  const activeInjuries = med?.active_injuries?.length
    ? (med.active_injuries as any[]).map((x, i) => ({
        id: `inj${i}`,
        area: x.location ?? x.area ?? "—",
        desc: x.description ?? "",
        pain: x.pain_level ?? x.pain ?? 0,
        since: x.start_date ?? "—",
        treatment: !!x.in_treatment,
        treatmentDesc: x.treatment ?? "—",
        painHistory: [{ date: x.start_date ?? "—", v: x.pain_level ?? x.pain ?? 0 }],
      }))
    : [];
  const pastInjuries = med?.past_injuries?.length
    ? (med.past_injuries as any[]).map((x, i) => ({
        id: `p${i}`, area: x.description ?? x.location ?? "—",
        from: String(x.year ?? "—"), to: "—", days: 0,
      }))
    : [];
  const chronic = med?.chronic_conditions ?? [];
  const allergies = med?.allergies ?? [];
  const medication = med?.medications?.length
    ? (med.medications as any[]).map((m) => ({ name: m.name ?? "—", dose: m.dose ?? "—", when: m.schedule ?? "—" }))
    : [];
  const clinicalDocs = med
    ? [
        { id: "d1", type: "Electrocardiograma", url: med.ecg_file_url },
        { id: "d2", type: "Apto médico", url: med.medical_clearance_url },
        { id: "d3", type: "Análisis de sangre", url: med.blood_work_url },
        { id: "d4", type: "Radiografía", url: med.xray_file_url },
      ]
        .filter((d) => d.url)
        .map((d) => ({ id: d.id, type: d.type, date: "—", size: "—", isImage: false }))
    : [];

  return { bodyData, activeInjuries, pastInjuries, chronic, allergies, medication, clinicalDocs };
}

export function buildJourney(j: DbJourney, race: typeof mock.race) {
  const KIND: Record<string, mock.TLKind> = {
    desliz: "slip", injury: "injury", illness: "injury", pr: "pr", milestone: "milestone",
  };
  const timeline = j.events.map((e) => ({
    date: e.occurred_at.slice(0, 10),
    kind: KIND[e.event_type] ?? "milestone",
    title: e.description,
    detail: e.resolved_at ? `Resuelto ${e.resolved_at.slice(0, 10)}` : "",
  }));

  const journeyCards = j.cards.map((c) => ({
    id: c.id,
    kind: c.card_type === "weekly" ? "Semanal" : c.card_type === "eve" ? "Víspera" : "Post-race",
    week: c.week_number,
    title: c.narrative_text ?? `Semana ${c.week_number}`,
    date: c.created_at.slice(0, 10),
  }));

  const scoreSeries = j.scoreSeries;
  const avg = (a: number[]) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0);
  const scoreStats = scoreSeries.length
    ? {
        current: scoreSeries.at(-1) ?? 0,
        avg7: avg(scoreSeries.slice(-7)),
        avg30: avg(scoreSeries.slice(-30)),
        avg90: avg(scoreSeries),
        percentile: mock.scoreStats.percentile,
      }
    : { current: 0, avg7: 0, avg30: 0, avg90: 0, percentile: 0 };

  const prs = j.events.filter((e) => e.event_type === "pr").length;
  const journeyTotals = j.events.length
    ? {
        sessions: 0,
        mealsLogged: 0,
        maxStreak: 0,
        prs,
        injuriesBeat: j.events.filter((e) => e.event_type === "injury" && e.resolved_at).length,
        slipsRecovered: j.events.filter((e) => e.event_type === "desliz").length,
        weeksOver90: scoreSeries.filter((s) => s >= 90).length,
      }
    : { sessions: 0, mealsLogged: 0, maxStreak: 0, prs: 0, injuriesBeat: 0, slipsRecovered: 0, weeksOver90: 0 };

  return { timeline, journeyCards, scoreSeries, scoreStats, journeyTotals, race };
}
