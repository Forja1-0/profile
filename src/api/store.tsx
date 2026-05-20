/**
 * Fuente única de datos del perfil. Si hay sesión activa (post-login WhatsApp) o VITE_USER_ID configurado, lee la
 * API real (forja-api, schema canónico), la transforma a las formas de la UI
 * y expone mutaciones que pegan al backend. Si no hay usuario o la API falla,
 * cae a los datos demo (mock) y las mutaciones quedan locales — así el perfil
 * SIEMPRE funciona, standalone o conectado.
 */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import {
  api, currentUserId, ApiError,
  type DbProfileIdentity, type DbNutrition,
  type DbHealth, type DbDocument, type DbPreferences,
} from "./client";
import {
  buildHome, buildNutrition, buildTraining, buildHealth, buildJourney, mealFromDb, mealToPayload,
} from "./transformers";
import * as mock from "../data/mock";
import type { FrequentMeal } from "../data/mock";

export type Source = "demo" | "live";

export interface Bundle {
  athlete: typeof mock.athlete;
  race: typeof mock.race;
  today: typeof mock.today;
  week: typeof mock.week;
  weekSummary: typeof mock.weekSummary;
  streaks: typeof mock.streaks;
  nutritionPlan: typeof mock.nutritionPlan;
  restrictions: typeof mock.restrictions;
  nutritionHistory: typeof mock.nutritionHistory;
  weeklyPlan: typeof mock.weeklyPlan;
  sessionHistory: typeof mock.sessionHistory;
  sessionStats: typeof mock.sessionStats;
  personalRecords: typeof mock.personalRecords;
  bodyData: typeof mock.bodyData;
  activeInjuries: typeof mock.activeInjuries;
  pastInjuries: typeof mock.pastInjuries;
  chronic: typeof mock.chronic;
  allergies: typeof mock.allergies;
  medication: typeof mock.medication;
  clinicalDocs: typeof mock.clinicalDocs;
  timeline: typeof mock.timeline;
  journeyCards: typeof mock.journeyCards;
  scoreSeries: typeof mock.scoreSeries;
  scoreStats: typeof mock.scoreStats;
  journeyTotals: typeof mock.journeyTotals;
}

function demoBundle(): Bundle {
  return {
    athlete: mock.athlete, race: mock.race, today: mock.today, week: mock.week,
    weekSummary: mock.weekSummary, streaks: mock.streaks as Bundle["streaks"],
    nutritionPlan: mock.nutritionPlan, restrictions: mock.restrictions,
    nutritionHistory: mock.nutritionHistory, weeklyPlan: mock.weeklyPlan,
    sessionHistory: mock.sessionHistory, sessionStats: mock.sessionStats,
    personalRecords: mock.personalRecords, bodyData: mock.bodyData,
    activeInjuries: mock.activeInjuries, pastInjuries: mock.pastInjuries,
    chronic: mock.chronic, allergies: mock.allergies, medication: mock.medication,
    clinicalDocs: mock.clinicalDocs, timeline: mock.timeline,
    journeyCards: mock.journeyCards, scoreSeries: mock.scoreSeries,
    scoreStats: mock.scoreStats, journeyTotals: mock.journeyTotals,
  };
}

/** Slices crudas del backend que los formularios necesitan para armar payloads. */
interface Raw {
  identity: DbProfileIdentity | null;
  nutrition: DbNutrition | null;
  health: DbHealth | null;
}

export interface MedItem { name: string; dose: string; when: string }

interface Ctx {
  source: Source;
  loading: boolean;
  error: string | null;
  data: Bundle;
  meals: FrequentMeal[];
  raw: Raw;
  documents: DbDocument[];
  preferences: DbPreferences;
  reload: () => Promise<void>;

  createMeal: (m: FrequentMeal) => Promise<void>;
  updateMeal: (m: FrequentMeal) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;

  updateIdentity: (patch: Partial<{ name: string; age: number; sex: "M" | "F" | "X"; email: string; phone_wa: string }>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  exportUrl: string | null;

  updateNutritionPlan: (d: { target_kcal: number; target_protein_g: number; target_carbs_g: number; target_fat_g: number; nutritionist_name?: string | null }) => Promise<void>;
  uploadNutritionPlanFile: (f: File) => Promise<void>;
  deleteNutritionPlanFile: () => Promise<void>;
  nutritionPlanFileUrl: string | null;

  saveRestrictions: (flags: Record<string, boolean>, other: string | null) => Promise<void>;
  updateBody: (patch: { weight_kg?: number; body_fat_pct?: number; height_cm?: number }) => Promise<void>;

  saveActiveInjuries: (injuries: unknown[]) => Promise<void>;
  saveMedical: (patch: Partial<{
    chronic_conditions: string[];
    allergies: string[];
    medications: Array<{ name: string; dose: string; schedule: string }>;
    active_injuries: unknown[];
    past_injuries: unknown[];
  }>) => Promise<void>;

  uploadDocument: (f: File, slot: string, docType: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  documentFileUrl: (id: string) => string | null;

  savePreferences: (p: DbPreferences) => Promise<void>;
}

const ProfileCtx = createContext<Ctx | null>(null);

const DEFAULT_PREFS: DbPreferences = {
  reminders: mock.reminders.map((r) => ({ ...r })),
  custom_reminders: mock.customReminders.map((c) => ({ ...c })),
  quiet_hours: { ...mock.quietHours },
  alert_threshold_pct: 85,
  bot_tone: mock.botTone,
  privacy: { rank: true, community_avg: true, newsletter: false },
};

export function ProfileDataProvider({ children }: { children: ReactNode }) {
  const [source, setSource] = useState<Source>("demo");
  const [loading, setLoading] = useState<boolean>(!!currentUserId());
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Bundle>(demoBundle);
  const [meals, setMeals] = useState<FrequentMeal[]>(mock.frequentMeals);
  const [raw, setRaw] = useState<Raw>({ identity: null, nutrition: null, health: null });
  const [documents, setDocuments] = useState<DbDocument[]>([]);
  const [preferences, setPreferences] = useState<DbPreferences>(DEFAULT_PREFS);
  const liveRef = useRef(false);

  async function load() {
    const [id, ov, nu, tr, he, jo, ml, docs, prefs] = await Promise.all([
      api.identity(currentUserId()), api.overview(currentUserId()), api.nutrition(currentUserId()),
      api.training(currentUserId()), api.health2(currentUserId()), api.journey(currentUserId()),
      api.listMeals(currentUserId()), api.listDocuments(currentUserId()), api.getPreferences(currentUserId()),
    ]);
    const home = buildHome(id, ov);
    const nut = buildNutrition(nu);
    const trn = buildTraining(tr);
    const hea = buildHealth(he);
    const jrn = buildJourney(jo, home.race);
    setData({
      ...home, ...nut, ...trn, ...hea, ...jrn,
      streaks: home.streaks as Bundle["streaks"],
    });
    setMeals(ml.meals.length ? ml.meals.map(mealFromDb) : []);
    setRaw({ identity: id, nutrition: nu, health: he });
    setDocuments(docs.documents);
    setPreferences({ ...DEFAULT_PREFS, ...(prefs ?? {}) });
    setSource("live");
    liveRef.current = true;
    setError(null);
  }

  useEffect(() => {
    if (!currentUserId()) return; // demo directo
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof ApiError ? `API ${e.status}: ${e.message}` : (e as Error).message;
        setError(`Sin conexión al backend (${msg}). Mostrando datos demo.`);
        setSource("demo");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const isLive = () => liveRef.current && source === "live";
  const reload = async () => { if (isLive()) await load(); };

  /* ---------- Comidas frecuentes ---------- */
  const createMeal = async (m: FrequentMeal) => {
    if (isLive()) {
      const saved = await api.createMeal(currentUserId(), mealToPayload(m));
      setMeals((p) => [...p, mealFromDb(saved)]);
    } else setMeals((p) => [...p, m]);
  };
  const updateMeal = async (m: FrequentMeal) => {
    if (isLive()) {
      const saved = await api.updateMeal(currentUserId(), m.id, mealToPayload(m));
      setMeals((p) => p.map((x) => (x.id === m.id ? mealFromDb(saved) : x)));
    } else setMeals((p) => p.map((x) => (x.id === m.id ? m : x)));
  };
  const deleteMeal = async (id: string) => {
    if (isLive()) await api.deleteMeal(currentUserId(), id);
    setMeals((p) => p.filter((x) => x.id !== id));
  };

  /* ---------- Datos personales / cuenta ---------- */
  const updateIdentity: Ctx["updateIdentity"] = async (patch) => {
    if (isLive()) { await api.updateIdentity(currentUserId(), patch); await reload(); }
    else setData((d) => ({ ...d, athlete: { ...d.athlete, ...patch, name: patch.name ?? d.athlete.name } }));
  };
  const deleteAccount = async () => { if (isLive()) await api.deleteAccount(currentUserId()); };

  /* ---------- Plan nutricional ---------- */
  const updateNutritionPlan: Ctx["updateNutritionPlan"] = async (d) => {
    if (isLive()) { await api.updateNutritionPlan(currentUserId(), d); await reload(); }
    else setData((s) => ({ ...s, nutritionPlan: { ...s.nutritionPlan, kcal: d.target_kcal, protein: d.target_protein_g, carbs: d.target_carbs_g, fat: d.target_fat_g } }));
  };
  const uploadNutritionPlanFile = async (f: File) => {
    if (isLive()) { await api.uploadNutritionPlanFile(currentUserId(), f); await reload(); }
  };
  const deleteNutritionPlanFile = async () => {
    if (isLive()) { await api.deleteNutritionPlanFile(currentUserId()); await reload(); }
  };

  /* ---------- Restricciones / cuerpo ---------- */
  const saveRestrictions: Ctx["saveRestrictions"] = async (flags, other) => {
    if (isLive()) { await api.updateRestrictions(currentUserId(), flags, other); await reload(); }
  };
  const updateBody: Ctx["updateBody"] = async (patch) => {
    if (isLive()) { await api.updateBody(currentUserId(), patch); await reload(); }
    else setData((d) => ({
      ...d,
      bodyData: {
        ...d.bodyData,
        currentWeight: patch.weight_kg ?? d.bodyData.currentWeight,
        bodyFat: patch.body_fat_pct ?? d.bodyData.bodyFat,
        heightCm: patch.height_cm ?? d.bodyData.heightCm,
      },
    }));
  };

  /* ---------- Médico ---------- */
  const saveActiveInjuries = async (injuries: unknown[]) => {
    if (isLive()) { await api.updateInjuries(currentUserId(), injuries); await reload(); }
  };
  const saveMedical: Ctx["saveMedical"] = async (patch) => {
    if (isLive()) { await api.updateMedical(currentUserId(), patch); await reload(); }
    else setData((d) => ({
      ...d,
      chronic: patch.chronic_conditions ?? d.chronic,
      allergies: patch.allergies ?? d.allergies,
      medication: patch.medications
        ? patch.medications.map((m) => ({ name: m.name, dose: m.dose, when: m.schedule }))
        : d.medication,
    }));
  };

  /* ---------- Documentos ---------- */
  const uploadDocument = async (f: File, slot: string, docType: string) => {
    if (isLive()) {
      const doc = await api.uploadDocument(currentUserId(), f, slot, docType);
      setDocuments((p) => [doc, ...p]);
    }
  };
  const deleteDocument = async (id: string) => {
    if (isLive()) await api.deleteDocument(currentUserId(), id);
    setDocuments((p) => p.filter((d) => d.id !== id));
  };
  const documentFileUrl = (id: string) => (isLive() ? api.documentFileUrl(currentUserId(), id) : null);

  /* ---------- Preferencias ---------- */
  const savePreferences = async (p: DbPreferences) => {
    setPreferences(p);
    if (isLive()) await api.savePreferences(currentUserId(), p);
  };

  return (
    <ProfileCtx.Provider
      value={{
        source, loading, error, data, meals, raw, documents, preferences, reload,
        createMeal, updateMeal, deleteMeal,
        updateIdentity, deleteAccount,
        exportUrl: currentUserId() ? api.exportUrl(currentUserId()) : null,
        updateNutritionPlan, uploadNutritionPlanFile, deleteNutritionPlanFile,
        nutritionPlanFileUrl:
          currentUserId() && raw.nutrition?.active?.plan_file_url ? api.nutritionPlanFileUrl(currentUserId()) : null,
        saveRestrictions, updateBody,
        saveActiveInjuries, saveMedical,
        uploadDocument, deleteDocument, documentFileUrl,
        savePreferences,
      }}
    >
      {children}
    </ProfileCtx.Provider>
  );
}

export function useProfileData(): Ctx {
  const ctx = useContext(ProfileCtx);
  if (!ctx) throw new Error("useProfileData must be used within ProfileDataProvider");
  return ctx;
}
