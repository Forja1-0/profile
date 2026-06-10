import { useEffect, useRef, useState } from "react";
import { foodTable, type FrequentMeal, type Ingredient } from "../data/mock";
import { useProfileData } from "../api/store";
import { api } from "../api/client";
import { restrictionsToFlags, type MealLogEntry } from "../api/transformers";
import { waActions } from "../lib/whatsapp";
import { isAmateur } from "../lib/mode";
import {
  SectionHeader, Tabs, Pill, Row, ConfirmDialog, Sheet, Checkbox, Callout, EmptyState, toast,
} from "../components/ui";
import { LineChart } from "../components/charts";

type Tab = "comidas" | "plan" | "restricciones" | "historial";
const DAYPARTS = ["Desayuno", "Almuerzo", "Merienda", "Cena", "Snack"] as const;

function totals(ings: Ingredient[]) {
  return ings.reduce(
    (a, x) => ({ p: a.p + x.p, c: a.c + x.c, f: a.f + x.f, kcal: a.kcal + x.kcal }),
    { p: 0, c: 0, f: 0, kcal: 0 },
  );
}

export function Nutrition() {
  const [tab, setTab] = useState<Tab>("comidas");
  return (
    <>
      <SectionHeader
        eyebrow="Nutrición"
        title="El corazón del tracking"
        lede="Lo que cargás acá es lo que el bot usa todos los días. MyFitnessPal te muestra el día; Forja te muestra la tendencia."
        action={<a href={waActions.logMeal} target="_blank" rel="noreferrer" className="f-btn f-btn-wa">Loguear comida</a>}
      />
      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "comidas", label: "Comidas frecuentes" },
          { value: "plan", label: "Plan nutricional" },
          { value: "restricciones", label: "Restricciones" },
          { value: "historial", label: "Historial" },
        ]}
      />
      {tab === "comidas" && <FrequentMeals />}
      {tab === "plan" && <NutritionPlan />}
      {tab === "restricciones" && <Restrictions />}
      {tab === "historial" && <NutritionHistory />}
    </>
  );
}

/* ---------------- 2.1 Comidas Frecuentes ---------------- */
function FrequentMeals() {
  const { meals, createMeal, updateMeal, deleteMeal } = useProfileData();
  const [editing, setEditing] = useState<FrequentMeal | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<FrequentMeal | null>(null);
  const [busy, setBusy] = useState(false);

  const count = meals.length;
  // Amateur llega y abandona si le pedimos 10 comidas frecuentes; con 5 ya
  // tiene cubierto desayuno/almuerzo/cena + 2 snacks.
  const goal = isAmateur() ? 5 : 10;

  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    try { await fn(); toast(ok); }
    catch (e) { toast((e as Error).message || "No se pudo guardar", "error"); }
    finally { setBusy(false); }
  };

  const duplicate = (m: FrequentMeal) =>
    run(() => createMeal({ ...m, id: crypto.randomUUID(), name: `${m.name} (copia)`, uses30d: 0 }), "Comida duplicada");
  const save = (m: FrequentMeal) =>
    run(() => (meals.some((x) => x.id === m.id) ? updateMeal(m) : createMeal(m)), "Comida guardada");

  return (
    <>
      <div className="f-card-soft flex items-center gap-4 mb-4">
        <div className="flex-1">
          <div className="text-[14px] text-f-text font-medium">{count}/{goal} comidas frecuentes</div>
          <div className="text-[12px] text-f-text2 mt-0.5">Cuanto más cargues, más rápido es tu tracking diario.</div>
        </div>
        <div className="w-28 f-progress-track flex-none">
          <div className="f-progress-fill" style={{ width: `${Math.min(100, (count / goal) * 100)}%`, background: "linear-gradient(90deg,#2D4532,#5B8A64)" }} />
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <button className="f-btn f-btn-primary f-btn-sm" onClick={() => setCreating(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span> Nueva comida
        </button>
      </div>

      {meals.length === 0 && (
        <EmptyState icon="restaurant" title="Sin comidas frecuentes" hint="Creá tu primera para acelerar el tracking diario." />
      )}

      {DAYPARTS.map((dp) => {
        const list = meals.filter((m) => m.daypart === dp);
        if (!list.length) return null;
        return (
          <div key={dp} className="mb-5">
            <div className="f-datalabel mb-2">{dp}</div>
            <div className="f-card !p-0 divide-y divide-f-border">
              {list.map((m, idx) => {
                const t = totals(m.ingredients);
                return (
                  <div key={m.id} className="px-4 sm:px-5">
                    <Row
                      icon="lunch_dining"
                      iconTone="green"
                      title={`${dp} ${idx + 1} — ${m.name.replace(/^.*— /, "")}`}
                      sub={
                        <span className="font-mono text-[11px]">
                          P {Math.round(t.p)} · C {Math.round(t.c)} · G {Math.round(t.f)} · {Math.round(t.kcal)} kcal · {m.ingredients.length} ingr.
                        </span>
                      }
                      meta={<Pill tone="neutral">{m.uses30d}× / 30d</Pill>}
                      action={
                        <div className="flex items-center gap-0.5">
                          <button className="f-btn-ghost" title="Editar" disabled={busy} onClick={() => setEditing(m)}>
                            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>edit</span>
                          </button>
                          <button className="f-btn-ghost" title="Duplicar" disabled={busy} onClick={() => duplicate(m)}>
                            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>content_copy</span>
                          </button>
                          <button className="f-btn-ghost text-f-red-light" title="Eliminar" disabled={busy} onClick={() => setToDelete(m)}>
                            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>delete</span>
                          </button>
                        </div>
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {(editing || creating) && (
        <MealEditor
          meal={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSave={(m) => { save(m); setEditing(null); setCreating(false); }}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar comida frecuente"
        danger
        confirmLabel="Eliminar"
        body={<>Si la borrás, el alias <span className="font-mono text-f-text">«{toDelete?.name.split(" — ")[0].toLowerCase()}»</span> deja de funcionar en WhatsApp. Esta acción no se puede deshacer.</>}
        onConfirm={() => { if (toDelete) run(() => deleteMeal(toDelete.id), "Comida eliminada"); setToDelete(null); }}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}

type FoodHit = { name: string; p: number; c: number; f: number; kcal: number };

/* Editor: nombre + momento + ingredientes con autocompletado real (food_items
   del backend) y macros en vivo. Sin backend cae a la tabla mock. */
function MealEditor({ meal, onClose, onSave }: { meal: FrequentMeal | null; onClose: () => void; onSave: (m: FrequentMeal) => void }) {
  const { source } = useProfileData();
  const [name, setName] = useState(meal?.name ?? "");
  const [daypart, setDaypart] = useState<FrequentMeal["daypart"]>(meal?.daypart ?? "Desayuno");
  const [ings, setIngs] = useState<Ingredient[]>(meal?.ingredients ?? []);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<FoodHit[]>([]);
  const [searching, setSearching] = useState(false);
  // base por-100g por nombre, para recalcular al cambiar gramos
  const baseRef = useRef<Map<string, Omit<FoodHit, "name">>>(new Map());

  useEffect(() => {
    const q = query.trim();
    if (!q) { setHits([]); return; }
    if (source !== "live") {
      setHits(foodTable.filter((f) => f.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6));
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await api.searchFood(q, 8);
        if (cancelled) return;
        setHits(res.map((r) => ({
          name: r.name, p: r.protein_per_100g, c: r.carbs_per_100g, f: r.fat_per_100g, kcal: r.kcal_per_100g,
        })));
      } catch {
        if (!cancelled) setHits([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query, source]);

  const t = totals(ings);

  const addFood = (f: FoodHit) => {
    baseRef.current.set(f.name, { p: f.p, c: f.c, f: f.f, kcal: f.kcal });
    const k = 100 / 100;
    setIngs((p) => [...p, { name: f.name, grams: 100, p: +(f.p * k).toFixed(1), c: +(f.c * k).toFixed(1), f: +(f.f * k).toFixed(1), kcal: Math.round(f.kcal * k) }]);
    setQuery("");
    setHits([]);
  };
  const setGrams = (i: number, grams: number) =>
    setIngs((p) =>
      p.map((x, idx) => {
        if (idx !== i) return x;
        const base = baseRef.current.get(x.name) ?? foodTable.find((f) => f.name === x.name);
        if (!base) return { ...x, grams };
        const k = grams / 100;
        return { name: x.name, grams, p: +(base.p * k).toFixed(1), c: +(base.c * k).toFixed(1), f: +(base.f * k).toFixed(1), kcal: Math.round(base.kcal * k) };
      }),
    );

  return (
    <Sheet
      open
      title={meal ? "Editar comida frecuente" : "Nueva comida frecuente"}
      onClose={onClose}
      footer={
        <div className="grid grid-cols-2 gap-2">
          <button className="f-btn f-btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            className="f-btn f-btn-primary"
            disabled={!name || ings.length === 0}
            onClick={() => onSave({ id: meal?.id ?? crypto.randomUUID(), name, daypart, ingredients: ings, uses30d: meal?.uses30d ?? 0 })}
          >
            Guardar
          </button>
        </div>
      }
    >
      <div>
        <label className="f-label">Nombre</label>
        <input className="f-input" value={name} placeholder="Ej: Desayuno 1 — Huevos + tostadas" onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="f-label">Momento del día</label>
        <select className="f-input" value={daypart} onChange={(e) => setDaypart(e.target.value as FrequentMeal["daypart"])}>
          {DAYPARTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div>
        <label className="f-label">Ingredientes</label>
        <div className="relative">
          <input
            className="f-input"
            value={query}
            placeholder={source === "live" ? "Buscar en los 913 alimentos argentinos…" : "Buscar alimento…"}
            onChange={(e) => setQuery(e.target.value)}
          />
          {(hits.length > 0 || searching) && (
            <div className="absolute z-10 left-0 right-0 mt-1 bg-f-card border border-f-border2 rounded-lg overflow-hidden">
              {searching && hits.length === 0 && (
                <div className="px-3.5 py-2.5 text-[12px] text-f-text3">Buscando…</div>
              )}
              {hits.map((s) => (
                <button key={s.name} className="w-full text-left px-3.5 py-2.5 hover:bg-f-hover flex justify-between items-center" onClick={() => addFood(s)}>
                  <span className="text-[13px] text-f-text">{s.name}</span>
                  <span className="font-mono text-[10px] text-f-text3">{s.kcal} kcal/100g</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {ings.length === 0 && <p className="text-[12px] text-f-text3">Agregá ingredientes ilimitados. Los macros se calculan solos.</p>}
          {ings.map((x, i) => (
            <div key={i} className="flex items-center gap-2 bg-f-surface border border-f-border rounded-lg px-3 py-2">
              <span className="flex-1 text-[13px] text-f-text truncate">{x.name}</span>
              <div className="f-field w-[92px] flex-none">
                <input className="f-input has-suffix !h-9 text-[13px]" type="number" value={x.grams} onChange={(e) => setGrams(i, Number(e.target.value) || 0)} />
                <span className="f-suffix">g</span>
              </div>
              <span className="font-mono text-[10px] text-f-text3 w-[58px] text-right">{x.kcal} kcal</span>
              <button className="f-btn-ghost text-f-red-light !p-1" onClick={() => setIngs((p) => p.filter((_, idx) => idx !== i))}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="f-card-soft grid grid-cols-4 gap-2 text-center">
        {[["P", t.p, "g"], ["C", t.c, "g"], ["G", t.f, "g"], ["Kcal", t.kcal, ""]].map(([l, v, u]) => (
          <div key={l as string}>
            <div className="font-sans font-bold text-[17px] text-f-green-glow">{Math.round(v as number)}<span className="text-[11px] text-f-text3">{u}</span></div>
            <div className="f-datalabel mt-0.5">{l}</div>
          </div>
        ))}
      </div>
    </Sheet>
  );
}

/* ---------------- 2.2 Plan Nutricional ---------------- */
function NutritionPlan() {
  const {
    data, source, updateNutritionPlan, nutritionPlanFileUrl,
    uploadNutritionPlanFile, deleteNutritionPlanFile,
  } = useProfileData();
  const p = data.nutritionPlan;
  const sum = p.protein * 4 + p.carbs * 4 + p.fat * 9;
  const pctP = sum ? Math.round((p.protein * 4 / sum) * 100) : 0;
  const pctC = sum ? Math.round((p.carbs * 4 / sum) * 100) : 0;
  const pctF = 100 - pctP - pctC;
  const [del, setDel] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setBusy(true);
    try { await uploadNutritionPlanFile(f); toast("Plan subido"); }
    catch (err) { toast((err as Error).message || "No se pudo subir", "error"); }
    finally { setBusy(false); }
  };

  return (
    <>
      <div className="f-card">
        <div className="flex items-center justify-between mb-4">
          <span className="f-datalabel">Macros target actuales</span>
          <button className="f-btn-ghost text-f-green-light text-[13px]" onClick={() => setEditing(true)}>Editar macros</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { l: "Proteína", v: `${p.protein} g`, s: `${pctP}%` },
            { l: "Carbohidratos", v: `${p.carbs} g`, s: `${pctC}%` },
            { l: "Grasa", v: `${p.fat} g`, s: `${pctF}%` },
            { l: "Total", v: `${p.kcal}`, s: "kcal" },
          ].map((x) => (
            <div key={x.l} className="bg-f-surface rounded-lg p-4 border border-f-border">
              <div className="font-sans font-bold text-[22px] text-f-text">{x.v}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="f-datalabel">{x.l}</span>
                <span className="font-mono text-[10px] text-f-green-light">{x.s}</span>
              </div>
            </div>
          ))}
        </div>
        {data.targetSource === "forja_auto" && (
          <div className="mt-4 rounded-lg border border-f-border bg-f-surface px-4 py-3 flex gap-2.5 items-start">
            <span className="material-symbols-outlined text-f-green-light mt-0.5" style={{ fontSize: 16 }}>auto_awesome</span>
            <p className="text-[12px] leading-[1.5] text-f-text2">
              <span className="text-f-text">Target estimado por Forja</span> a partir de tus datos (peso, altura, edad, actividad) y tu meta —
              se recalcula solo cuando cargás tu peso. Es una estimación para empezar, <span className="text-f-text">no reemplaza a un nutricionista</span>.
              Si tenés un plan, subilo y mando estos números a un lado.
            </p>
          </div>
        )}
        <p className="text-[12px] text-f-text3 mt-4">Los cambios aplican desde mañana — no son retroactivos.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <div className="f-card">
          <span className="f-datalabel">Plan vigente</span>
          <Row
            icon="picture_as_pdf"
            iconTone="red"
            title={p.hasPdf ? "Plan nutricional (PDF)" : "Sin PDF cargado"}
            sub={`Nutricionista: ${p.nutritionist}`}
            action={
              nutritionPlanFileUrl ? (
                <a className="f-btn f-btn-secondary f-btn-sm" href={nutritionPlanFileUrl} target="_blank" rel="noreferrer">Descargar</a>
              ) : <span className="text-[12px] text-f-text3">—</span>
            }
          />
          <div className="flex gap-2 mt-2">
            <input ref={fileRef} type="file" accept=".pdf,image/*" className="hidden" onChange={onUpload} />
            <button className="f-btn f-btn-secondary f-btn-sm flex-1" disabled={busy || source !== "live"} onClick={() => fileRef.current?.click()}>
              {busy ? "Subiendo…" : "Subir nuevo plan"}
            </button>
            <button className="f-btn f-btn-danger f-btn-sm" disabled={busy || !p.hasPdf} onClick={() => setDel(true)}>Eliminar</button>
          </div>
          {source !== "live" && <p className="text-[11px] text-f-text3 mt-2">Subir PDF requiere conexión al backend.</p>}
        </div>
        <div className="f-card">
          <span className="f-datalabel">Historial de planes</span>
          <div className="mt-2 divide-y divide-f-border">
            {p.history.map((h) => (
              <Row key={h.from + h.label} icon="history" title={h.label} sub={`${h.from} → ${h.to}`} />
            ))}
          </div>
        </div>
      </div>

      {editing && (
        <MacroEditor
          plan={p}
          onClose={() => setEditing(false)}
          onSave={async (m) => {
            setEditing(false);
            try { await updateNutritionPlan(m); toast("Macros actualizados"); }
            catch (err) { toast((err as Error).message || "No se pudo guardar", "error"); }
          }}
        />
      )}

      <ConfirmDialog
        open={del}
        title="Eliminar plan nutricional"
        danger
        confirmLabel="Eliminar igual"
        body="Sin el PDF cargado el bot pierde la referencia del plan del nutricionista (los macros target se mantienen). ¿Confirmás?"
        onConfirm={async () => {
          try { await deleteNutritionPlanFile(); toast("PDF del plan eliminado"); }
          catch (err) { toast((err as Error).message || "No se pudo eliminar", "error"); }
        }}
        onClose={() => setDel(false)}
      />
    </>
  );
}

function MacroEditor({
  plan, onClose, onSave,
}: {
  plan: { protein: number; carbs: number; fat: number; kcal: number; nutritionist: string };
  onClose: () => void;
  onSave: (m: { target_kcal: number; target_protein_g: number; target_carbs_g: number; target_fat_g: number; nutritionist_name: string | null }) => void;
}) {
  const [protein, setProtein] = useState(plan.protein);
  const [carbs, setCarbs] = useState(plan.carbs);
  const [fat, setFat] = useState(plan.fat);
  const [kcal, setKcal] = useState(plan.kcal);
  const [nut, setNut] = useState(plan.nutritionist === "—" ? "" : plan.nutritionist);
  const computed = protein * 4 + carbs * 4 + fat * 9;

  return (
    <Sheet
      open
      title="Editar macros target"
      onClose={onClose}
      footer={
        <div className="grid grid-cols-2 gap-2">
          <button className="f-btn f-btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            className="f-btn f-btn-primary"
            disabled={kcal < 800 || kcal > 8000}
            onClick={() => onSave({
              target_kcal: kcal, target_protein_g: protein, target_carbs_g: carbs,
              target_fat_g: fat, nutritionist_name: nut.trim() || null,
            })}
          >
            Guardar
          </button>
        </div>
      }
    >
      {([
        ["Proteína (g)", protein, setProtein],
        ["Carbohidratos (g)", carbs, setCarbs],
        ["Grasa (g)", fat, setFat],
        ["Kcal total", kcal, setKcal],
      ] as const).map(([l, v, set]) => (
        <div key={l}>
          <label className="f-label">{l}</label>
          <input className="f-input" type="number" value={v} onChange={(e) => set(Number(e.target.value) || 0)} />
        </div>
      ))}
      <div>
        <label className="f-label">Nutricionista</label>
        <input className="f-input" value={nut} placeholder="Lic. Nombre Apellido" onChange={(e) => setNut(e.target.value)} />
      </div>
      <p className="text-[12px] text-f-text3">
        Kcal por macros: <span className="font-mono text-f-text">{computed}</span>. Se guarda el Kcal total que ingreses.
      </p>
    </Sheet>
  );
}

/* ---------------- 2.3 Restricciones ---------------- */
function Restrictions() {
  const { data, raw, saveRestrictions, source } = useProfileData();
  const otherText = () => {
    const o = raw.nutrition?.restrictions?.other;
    return typeof o === "string" ? o : "";
  };
  const [list, setList] = useState(data.restrictions);
  const [extra, setExtra] = useState(otherText);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setList(data.restrictions); }, [data.restrictions]);
  useEffect(() => { setExtra(otherText()); }, [raw.nutrition]);

  const save = async () => {
    setBusy(true);
    try {
      await saveRestrictions(restrictionsToFlags(list), extra.trim() || null);
      toast("Restricciones guardadas");
    } catch (e) {
      toast((e as Error).message || "No se pudo guardar", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="f-card">
        <span className="f-datalabel">Restricciones predefinidas</span>
        <p className="text-[12px] text-f-text2 mt-1 mb-4">Al guardar, el sugeridor de comidas del bot lo respeta sin excepción.</p>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3.5">
          {list.map((r) => (
            <Checkbox key={r.id} checked={r.active} label={r.label} onToggle={() => setList((p) => p.map((x) => (x.id === r.id ? { ...x, active: !x.active } : x)))} />
          ))}
        </div>
      </div>
      <div className="f-card mt-4">
        <label className="f-label">Restricciones adicionales (texto libre)</label>
        <textarea className="f-input" value={extra} placeholder="Ej: evito frituras, no como cítricos por reflujo…" onChange={(e) => setExtra(e.target.value)} />
      </div>
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <Callout icon="info">Lo que marques acá el bot lo respeta sin excepción al sugerirte qué comer.</Callout>
        <button className="f-btn f-btn-primary f-btn-sm w-full sm:w-auto flex-none" disabled={busy || source !== "live"} onClick={save}>
          {busy ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
      {source !== "live" && <p className="text-[11px] text-f-text3 mt-2 sm:text-right">Guardar requiere conexión al backend.</p>}
    </>
  );
}

/* ---------------- 2.4 Historial Nutricional ---------------- */
type MacroFilter = "kcal" | "p" | "c" | "f" | "todo";

const MACRO_META: Record<Exclude<MacroFilter, "todo">, { label: string; color: string }> = {
  kcal: { label: "Kcal", color: "#5B8A64" },
  p: { label: "Proteína", color: "#C49A3C" },
  c: { label: "Carbohidratos", color: "#A8404D" },
  f: { label: "Grasa", color: "#C9A24B" },
};

/** Lista de comidas REALES cargadas por el usuario (meal_logs). */
function RecentMealsCard({ meals }: { meals: MealLogEntry[] }) {
  if (!meals.length) {
    return (
      <EmptyState
        icon="restaurant"
        title="Sin comidas registradas aún"
        hint="Decile al bot lo que comiste por WhatsApp (ej: «comí 2 huevos con pan») y aparece acá al instante."
      />
    );
  }
  return (
    <div className="f-card !p-0 overflow-hidden mb-4">
      <div className="px-5 py-3 border-b border-f-border f-datalabel">Comidas registradas</div>
      <div className="divide-y divide-f-border">
        {meals.slice(0, 30).map((m) => (
          <div key={m.id} className="px-4 sm:px-5 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[14px] text-f-text truncate">
                {m.title}
                {m.isEstimate && (
                  <span className="ml-2 font-mono text-[10px] text-f-text3 align-middle">estimado</span>
                )}
              </div>
              <div className="font-mono text-[11px] text-f-text3 mt-0.5">
                {m.date.slice(5)}{m.time ? ` · ${m.time}` : ""} · P {m.p} · C {m.c} · G {m.f}
              </div>
            </div>
            <div className="font-mono text-[12px] text-f-text flex-none">{m.kcal} kcal</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NutritionHistory() {
  const { data } = useProfileData();
  const plan = data.nutritionPlan;
  const [range, setRange] = useState<7 | 14 | 30 | 90 | "todo">(14);
  const [macro, setMacro] = useState<MacroFilter>("kcal");

  const allHistory = data.nutritionHistory;
  const historyData = range === "todo" ? allHistory : allHistory.slice(-range);

  const isTodo = macro === "todo";
  const singleMeta = isTodo ? null : MACRO_META[macro];
  const singleTarget = macro === "kcal" ? plan.kcal : macro === "p" ? plan.protein : macro === "c" ? plan.carbs : macro === "f" ? plan.fat : 0;
  const singleAvg = !isTodo && historyData.length > 0
    ? Math.round(historyData.reduce((a, d) => a + d[macro as Exclude<MacroFilter, "todo">], 0) / historyData.length)
    : 0;

  // "Todo": mostrar todas las series normalizadas como % del target (escala comparable)
  const todoSeries = isTodo
    ? (Object.entries(MACRO_META) as [Exclude<MacroFilter, "todo">, typeof MACRO_META[keyof typeof MACRO_META]][]).map(([key, meta]) => {
        const tgt = key === "kcal" ? plan.kcal : key === "p" ? plan.protein : key === "c" ? plan.carbs : plan.fat;
        return {
          data: historyData.map((d) => tgt > 0 ? Math.round((d[key] / tgt) * 100) : 0),
          color: meta.color,
          name: meta.label,
        };
      })
    : null;

  const chartLabels = [
    historyData[0]?.date.slice(5),
    historyData[Math.floor(historyData.length / 2)]?.date.slice(5),
    historyData[historyData.length - 1]?.date.slice(5),
  ].filter(Boolean);

  return (
    <>
      {/* Comidas reales cargadas por WhatsApp — aparecen al instante. */}
      <RecentMealsCard meals={data.recentMeals} />

      {allHistory.length === 0 ? (
        <EmptyState
          icon="bar_chart"
          title="Sin tendencia todavía"
          hint="La tendencia diaria (adherencia, promedios) se arma con tus comidas. Volvé en unos días para verla."
        />
      ) : (
      <>
      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mb-4">
        <div className="flex flex-wrap gap-2">
          {([7, 14, 30, 90] as const).map((r) => (
            <button key={r} className="f-tab" aria-selected={range === r} onClick={() => setRange(r)}>{r}d</button>
          ))}
          <button className="f-tab" aria-selected={range === "todo"} onClick={() => setRange("todo")}>Todo</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["kcal", "p", "c", "f"] as const).map((mm) => (
            <button key={mm} className="f-tab" aria-selected={macro === mm} onClick={() => setMacro(mm)}>
              {{ kcal: "Kcal", p: "P", c: "C", f: "G" }[mm]}
            </button>
          ))}
          <button className="f-tab" aria-selected={macro === "todo"} onClick={() => setMacro("todo")}>Todo</button>
        </div>
      </div>

      <div className="f-card">
        <div className="flex items-center justify-between mb-4">
          <span className="f-datalabel">
            {isTodo ? "Todos los macros — % del target" : `${singleMeta!.label} — consumido vs. target`}
          </span>
          {!isTodo && (
            <span className="font-mono text-[11px] text-f-text2">
              Prom. <span className="text-f-text">{singleAvg}</span> · target {singleTarget}
            </span>
          )}
        </div>

        {isTodo ? (
          <>
            <LineChart
              height={180}
              labels={chartLabels}
              series={todoSeries!}
            />
            <div className="flex flex-wrap gap-4 mt-3">
              {(Object.entries(MACRO_META) as [string, typeof MACRO_META[keyof typeof MACRO_META]][]).map(([, meta]) => (
                <span key={meta.label} className="flex items-center gap-1.5 text-[11px] text-f-text2">
                  <i className="w-3 h-0.5 inline-block rounded" style={{ background: meta.color }} /> {meta.label}
                </span>
              ))}
            </div>
          </>
        ) : (
          <>
            <LineChart
              height={180}
              labels={chartLabels}
              series={[
                { data: historyData.map((d) => d[macro as Exclude<MacroFilter, "todo">]), color: singleMeta!.color },
                { data: historyData.map(() => singleTarget), color: "#524F4A", dashed: true, name: "Target" },
              ]}
            />
            <div className="flex gap-5 mt-3">
              <span className="flex items-center gap-1.5 text-[11px] text-f-text2">
                <i className="w-3 h-0.5 inline-block rounded" style={{ background: singleMeta!.color }} /> Consumido
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-f-text2">
                <i className="w-3 h-0.5 bg-f-text3 inline-block rounded" /> Target
              </span>
            </div>
          </>
        )}
      </div>

      {!isTodo && historyData.length > 0 && (
        <div className="f-card mt-4 !p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-f-border f-datalabel">Detalle diario</div>
          <div className="f-scroll-x">
            <table className="f-table min-w-[520px]">
              <thead><tr><th>Fecha</th><th>Kcal</th><th>P</th><th>C</th><th>G</th><th>Adher.</th></tr></thead>
              <tbody>
                {[...historyData].reverse().map((d) => (
                  <tr key={d.date}>
                    <td>{d.date.slice(5)}</td>
                    <td style={{ color: Math.abs(d.kcal - plan.kcal) > 250 ? "#C49A3C" : "#D4CFC4" }}>{d.kcal}</td>
                    <td>{d.p}</td><td>{d.c}</td><td>{d.f}</td>
                    <td style={{ color: d.adherence >= 90 ? "#5B8A64" : d.adherence >= 75 ? "#C49A3C" : "#A8404D" }}>{d.adherence}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </>
      )}
    </>
  );
}
