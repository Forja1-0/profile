/**
 * Cliente HTTP del perfil. Mismo shape de errores que onboarding/src/api.
 * BASE = VITE_API_URL (default localhost:3000, el puerto de forja-api).
 *
 * Identificacion del usuario: viene de la sesion guardada en localStorage
 * (api/session.ts). El backend recibe `Authorization: Bearer <token>` y
 * resuelve el user_id por su lado. VITE_USER_ID se sigue soportando solo
 * como override de desarrollo para apuntar a un user fijo sin loguearse.
 */
import { clearSession, getSession } from "./session";

export const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/**
 * USER_ID dinamico: se evalua cada vez que alguien lo lee. Despues del
 * login se reflejan los cambios sin reload. En dev, VITE_USER_ID gana
 * porque permite trabajar contra una DB real sin pasar por WhatsApp.
 */
export function currentUserId(): string {
  const override = import.meta.env.VITE_USER_ID;
  if (override) return override;
  return getSession()?.userId ?? "";
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

async function unwrap<T>(res: Response): Promise<T> {
  if (res.ok) return (await res.json()) as T;
  if (res.status === 401) {
    // Sesion invalida -> limpiamos y forzamos re-login.
    clearSession();
  }
  const body = await res.json().catch(() => ({ error: "unknown_error" }));
  throw new ApiError(res.status, body.error ?? "unknown_error", body.details ?? body.issues);
}

function authHeaders(): Record<string, string> {
  const s = getSession();
  return s ? { Authorization: `Bearer ${s.token}` } : {};
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...authHeaders(), ...(init?.headers ?? {}) },
  });
  return unwrap<T>(res);
}

async function upload<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    body: form,
    headers: authHeaders(),
  });
  return unwrap<T>(res);
}

/* ---------- Tipos del backend (schema canónico) ---------- */
export interface DbOverview {
  goal: { event_name: string | null; event_date: string; distance: string | null; objective_notes: string | null; created_at: string } | null;
  plan: { target_kcal: number; target_protein_g: number; target_carbs_g: number; target_fat_g: number; nutritionist_name: string | null } | null;
  remaining: {
    target_kcal: number; target_protein_g: number; target_carbs_g: number; target_fat_g: number;
    consumed_kcal: number; consumed_protein: number; consumed_carbs: number; consumed_fat: number;
  } | null;
  todayTraining: { session_type: string; session_name: string | null; approx_time: string | null; duration_min: number | null } | null;
  summaries: Array<{ summary_date: string; total_kcal: number; total_protein_g: number; total_carbs_g: number; total_fat_g: number; kcal_adherence_pct: number | null; training_completed: boolean | null; training_rpe: number | null; performance_score: number | null }>;
  trainingLogs: Array<{ session_name: string; completed: boolean; rpe: number | null; notes: string | null; logged_at: string }>;
  events: Array<{ event_type: string; description: string; occurred_at: string }>;
}

export interface DbFrequentMeal {
  id: string;
  alias: string;
  ingredients: Array<{ food_item_id?: string | null; name: string; grams: number; kcal: number; protein: number; carbs: number; fat: number }>;
  total_kcal: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  use_count: number;
  created_at: string;
}

export interface DbNutrition {
  active: { target_kcal: number; target_protein_g: number; target_carbs_g: number; target_fat_g: number; nutritionist_name: string | null; plan_file_url: string | null } | null;
  history: Array<{ id: string; target_kcal: number; nutritionist_name: string | null; is_active: boolean; created_at: string }>;
  restrictions: Record<string, boolean | string | null> | null;
  summaries: Array<{ summary_date: string; total_kcal: number; total_protein_g: number; total_carbs_g: number; total_fat_g: number; kcal_adherence_pct: number | null }>;
}

export interface DbTraining {
  plan: Array<{ id: string; day_of_week: number; session_type: string; session_name: string | null; approx_time: string | null; duration_min: number | null; coach_name: string | null }>;
  logs: Array<{ id: string; session_name: string; completed: boolean; rpe: number | null; notes: string | null; modifications: string | null; logged_at: string }>;
  prs: Array<{ id: string; description: string; context: unknown; occurred_at: string }>;
  stats: { done: number; planned: number; rate: number; avgRpe: number | null };
}

export interface DbHealth {
  body: { weight_kg: number; height_cm: number; body_fat_pct: number | null; updated_at: string } | null;
  medical: {
    active_injuries: unknown[]; past_injuries: unknown[]; chronic_conditions: string[];
    allergies: string[]; medications: unknown[];
    ecg_file_url: string | null; xray_file_url: string | null; blood_work_url: string | null; medical_clearance_url: string | null;
  } | null;
}

export interface DbJourney {
  events: Array<{ id: string; event_type: string; description: string; severity: number | null; occurred_at: string; resolved_at: string | null }>;
  scoreSeries: number[];
  cards: Array<{ id: string; card_type: string; week_number: number; total_weeks: number; stats_snapshot: unknown; narrative_text: string | null; image_url: string | null; shared: boolean; created_at: string }>;
}

export interface DbProfileIdentity {
  user_id: string; name: string; age: number; sex: string; email: string;
  phone_wa: string; wa_connected: boolean; timezone: string; onboarding_step: number; member_since: string;
}

export interface DbDocument {
  id: string;
  slot: "ecg" | "xray" | "blood_work" | "medical_clearance" | "other";
  doc_type: string;
  raw_file_mime: string;
  raw_file_name: string;
  raw_file_size: number;
  created_at: string;
}

export interface DbPreferences {
  reminders?: Array<{ id: string; label: string; sub: string; time: string; on: boolean }>;
  custom_reminders?: Array<{ id: string; time: string; msg: string }>;
  quiet_hours?: { from: string; to: string };
  alert_threshold_pct?: number;
  bot_tone?: "rocky" | "analytic" | "empathic";
  privacy?: { rank: boolean; community_avg: boolean; newsletter: boolean };
}

export type MealPayload = {
  alias: string;
  ingredients: Array<{ food_item_id?: string | null; name: string; grams: number; kcal: number; protein: number; carbs: number; fat: number }>;
};

/* ---------- Endpoints ---------- */
export const api = {
  health: () => request<{ ok: true; ts: string }>("/healthz"),
  identity: (u: string) => request<DbProfileIdentity>(`/api/profile/${u}`),
  overview: (u: string) => request<DbOverview>(`/api/profile/${u}/overview`),
  nutrition: (u: string) => request<DbNutrition>(`/api/profile/${u}/nutrition`),
  training: (u: string) => request<DbTraining>(`/api/profile/${u}/training`),
  health2: (u: string) => request<DbHealth>(`/api/profile/${u}/health`),
  journey: (u: string) => request<DbJourney>(`/api/profile/${u}/journey`),

  listMeals: (u: string) => request<{ meals: DbFrequentMeal[] }>(`/api/profile/${u}/frequent-meals`),
  createMeal: (u: string, body: MealPayload) =>
    request<DbFrequentMeal>(`/api/profile/${u}/frequent-meals`, { method: "POST", body: JSON.stringify(body) }),
  updateMeal: (u: string, id: string, body: MealPayload) =>
    request<DbFrequentMeal>(`/api/profile/${u}/frequent-meals/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteMeal: (u: string, id: string) =>
    request<{ ok: true }>(`/api/profile/${u}/frequent-meals/${id}`, { method: "DELETE" }),

  updateRestrictions: (u: string, flags: Record<string, boolean>, other: string | null) =>
    request<unknown>(`/api/profile/${u}/restrictions`, { method: "PUT", body: JSON.stringify({ flags, other }) }),
  updateBody: (u: string, patch: { weight_kg?: number; body_fat_pct?: number; height_cm?: number }) =>
    request<unknown>(`/api/profile/${u}/body`, { method: "PUT", body: JSON.stringify(patch) }),
  searchFood: (q: string, limit = 8) =>
    request<Array<{ id: string; name: string; kcal_per_100g: number; protein_per_100g: number; carbs_per_100g: number; fat_per_100g: number }>>(
      `/api/food/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    ),

  /* ---------- Datos personales / cuenta ---------- */
  updateIdentity: (u: string, patch: Partial<{ name: string; age: number; sex: "M" | "F" | "X"; email: string; phone_wa: string; timezone: string }>) =>
    request<DbProfileIdentity>(`/api/profile/${u}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteAccount: (u: string) => request<{ ok: true }>(`/api/profile/${u}`, { method: "DELETE" }),
  exportUrl: (u: string) => `${API_BASE}/api/profile/${u}/export`,

  /* ---------- Plan nutricional ---------- */
  updateNutritionPlan: (u: string, d: { target_kcal: number; target_protein_g: number; target_carbs_g: number; target_fat_g: number; nutritionist_name?: string | null }) =>
    request<unknown>(`/api/profile/${u}/nutrition/plan`, { method: "PUT", body: JSON.stringify(d) }),
  nutritionPlanFileUrl: (u: string) => `${API_BASE}/api/profile/${u}/nutrition/plan/file`,
  uploadNutritionPlanFile: (u: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return upload<{ ok: true; id: string }>(`/api/profile/${u}/nutrition/plan/file`, fd);
  },
  deleteNutritionPlanFile: (u: string) =>
    request<{ ok: true }>(`/api/profile/${u}/nutrition/plan/file`, { method: "DELETE" }),

  /* ---------- Médico ---------- */
  updateMedical: (
    u: string,
    patch: Partial<{
      chronic_conditions: string[];
      allergies: string[];
      medications: Array<{ name: string; dose: string; schedule: string }>;
      past_injuries: unknown[];
      active_injuries: unknown[];
    }>,
  ) => request<unknown>(`/api/profile/${u}/medical`, { method: "PUT", body: JSON.stringify(patch) }),
  updateInjuries: (u: string, active_injuries: unknown[]) =>
    request<unknown>(`/api/profile/${u}/injuries`, { method: "PUT", body: JSON.stringify({ active_injuries }) }),

  /* ---------- Documentos clínicos ---------- */
  listDocuments: (u: string) =>
    request<{ documents: DbDocument[] }>(`/api/profile/${u}/documents`),
  uploadDocument: (u: string, file: File, slot: string, doc_type: string) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("slot", slot);
    fd.append("doc_type", doc_type);
    return upload<DbDocument>(`/api/profile/${u}/documents`, fd);
  },
  documentFileUrl: (u: string, id: string) => `${API_BASE}/api/profile/${u}/documents/${id}/file`,
  deleteDocument: (u: string, id: string) =>
    request<{ ok: true }>(`/api/profile/${u}/documents/${id}`, { method: "DELETE" }),

  /* ---------- Preferencias (recordatorios / tono / privacidad) ---------- */
  getPreferences: (u: string) => request<DbPreferences | null>(`/api/profile/${u}/preferences`),
  savePreferences: (u: string, prefs: DbPreferences) =>
    request<DbPreferences>(`/api/profile/${u}/preferences`, { method: "PUT", body: JSON.stringify(prefs) }),

  /* ---------- Recordatorios configurables (amateur) ---------- */
  listReminders: (u: string) =>
    request<{ ok: true; reminders: UserReminder[] }>(`/api/users/${u}/reminders`),
  createReminder: (u: string, body: ReminderCreate) =>
    request<{ ok: true; reminder: UserReminder }>(`/api/users/${u}/reminders`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateReminder: (u: string, id: string, patch: Partial<ReminderCreate>) =>
    request<{ ok: true; reminder: UserReminder }>(`/api/users/${u}/reminders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  deleteReminder: (u: string, id: string) =>
    request<{ ok: true }>(`/api/users/${u}/reminders/${id}`, { method: "DELETE" }),
};

export interface UserReminder {
  id: string;
  user_id: string;
  label: string;
  message: string;
  cron_expr: string;
  active: boolean;
  last_fired_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReminderCreate {
  label: string;
  message: string;
  cron_expr: string;
  active?: boolean;
}
