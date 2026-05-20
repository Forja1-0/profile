import { useState } from "react";
import { type SessionType } from "../data/mock";
import { useProfileData } from "../api/store";
import { waActions } from "../lib/whatsapp";
import { SectionHeader, Tabs, Pill, Row, ConfirmDialog, Sheet, FileDrop } from "../components/ui";
import { BarChart } from "../components/charts";

type Tab = "plan" | "historial" | "prs";
const ICON: Record<SessionType, string> = { gym: "fitness_center", swim: "pool", bike: "pedal_bike", run: "directions_run", rest: "bedtime" };
const TYPE_LABEL: Record<SessionType, string> = { gym: "Gym", swim: "Natación", bike: "Bici", run: "Corrida", rest: "Descanso" };

export function Training() {
  const [tab, setTab] = useState<Tab>("plan");
  return (
    <>
      <SectionHeader
        eyebrow="Entrenamiento"
        title="El segundo pilar"
        lede="Cargá tu estructura semanal. El bot la usa para recordarte qué toca y para manejar las disrupciones con contexto."
        action={<a href={waActions.reportSession} target="_blank" rel="noreferrer" className="f-btn f-btn-wa">Reportar sesión</a>}
      />
      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "plan", label: "Plan semanal" },
          { value: "historial", label: "Historial de sesiones" },
          { value: "prs", label: "Records personales" },
        ]}
      />
      {tab === "plan" && <WeeklyPlan />}
      {tab === "historial" && <SessionHistory />}
      {tab === "prs" && <PRs />}
    </>
  );
}

/* ---------------- 3.1 Plan semanal ---------------- */
function WeeklyPlan() {
  const { data } = useProfileData();
  const [editDay, setEditDay] = useState<typeof data.weeklyPlan[number] | null>(null);
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 mb-4">
        <div className="text-[13px] text-f-text2">Coach: <span className="text-f-text">Esteban Ruiz</span></div>
        <div className="flex flex-wrap gap-2">
          <button className="f-btn f-btn-secondary f-btn-sm flex-1 sm:flex-none">Subir plan (PDF)</button>
          <button className="f-btn f-btn-primary f-btn-sm flex-1 sm:flex-none">Editar plan completo</button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {data.weeklyPlan.map((d) => (
          <button key={d.day} onClick={() => setEditDay(d)} className="f-card text-left hover:border-f-green/40 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="f-datalabel">{d.day}</span>
              {d.type === "rest" ? <Pill tone="neutral">Descanso</Pill> : d.mandatory ? <Pill tone="green">Obligatoria</Pill> : <Pill tone="warn">Flexible</Pill>}
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined flex-none rounded-lg flex items-center justify-center bg-f-surface text-f-green-light" style={{ width: 40, height: 40, fontSize: 21 }}>
                {ICON[d.type]}
              </span>
              <div className="min-w-0">
                <div className="text-[14px] text-f-text font-medium leading-tight">{d.desc}</div>
                <div className="font-mono text-[11px] text-f-text2 mt-1">{TYPE_LABEL[d.type]} · {d.time}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {editDay && (
        <Sheet
          open
          title={`Editar — ${editDay.day}`}
          onClose={() => setEditDay(null)}
          footer={
            <div className="grid grid-cols-2 gap-2">
              <button className="f-btn f-btn-secondary" onClick={() => setEditDay(null)}>Cancelar</button>
              <button className="f-btn f-btn-primary" onClick={() => setEditDay(null)}>Guardar</button>
            </div>
          }
        >
          <div><label className="f-label">Tipo de sesión</label>
            <select className="f-input" defaultValue={editDay.type}>
              {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div><label className="f-label">Descripción</label><input className="f-input" defaultValue={editDay.desc} /></div>
          <div><label className="f-label">Horario aproximado</label><input className="f-input" defaultValue={editDay.time} /></div>
          <div><label className="f-label">Plan adjunto (referencia)</label><FileDrop accept=".pdf,image/*" label="Subir PDF / imagen" hint="No se parsea — queda como referencia tuya." /></div>
        </Sheet>
      )}
    </>
  );
}

/* ---------------- 3.2 Historial de sesiones ---------------- */
function SessionHistory() {
  const { data } = useProfileData();
  const [weeks, setWeeks] = useState<4 | 8 | 12>(8);
  const adherence = Array.from({ length: weeks }).map((_, i) => ({
    label: `S${14 - weeks + i + 1}`,
    v: Math.max(60, Math.min(100, Math.round(88 + Math.sin(i * 1.2) * 14))),
  }));
  const STATUS: Record<string, { tone: "green" | "red" | "warn"; label: string }> = {
    done: { tone: "green", label: "Completada" },
    skipped: { tone: "red", label: "Saltada" },
    partial: { tone: "warn", label: "Parcial" },
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-4">
        {[
          { l: "Completitud", v: `${data.sessionStats.rate}%`, s: `${data.sessionStats.done}/${data.sessionStats.planned}` },
          { l: "Sesiones", v: data.sessionStats.done, s: "desde día 1" },
          { l: "RPE promedio", v: data.sessionStats.avgRpe, s: "esfuerzo" },
          { l: "Saltadas", v: data.sessionStats.planned - data.sessionStats.done, s: "total" },
        ].map((x) => (
          <div key={x.l} className="f-card">
            <div className="font-sans font-bold text-[20px] sm:text-[22px] text-f-text">{x.v}</div>
            <div className="f-datalabel mt-1">{x.l}</div>
            <div className="font-mono text-[10px] text-f-text3 mt-0.5">{x.s}</div>
          </div>
        ))}
      </div>

      <div className="f-card mb-4">
        <div className="flex items-center justify-between mb-4">
          <span className="f-datalabel">Adherencia semanal</span>
          <div className="flex gap-2">
            {([4, 8, 12] as const).map((w) => (
              <button key={w} className="f-tab" aria-selected={weeks === w} onClick={() => setWeeks(w)}>{w} sem</button>
            ))}
          </div>
        </div>
        <BarChart data={adherence} height={150} />
      </div>

      <div className="f-card !p-0 divide-y divide-f-border">
        {data.sessionHistory.map((s) => {
          const st = STATUS[s.status] ?? STATUS.done;
          return (
            <div key={s.date} className="px-5">
              <Row
                icon={ICON[s.type]}
                iconTone={st.tone}
                title={<>{TYPE_LABEL[s.type]} <span className="font-mono text-[11px] text-f-text3">· {s.date}</span></>}
                sub={s.note || (s.rpe ? `RPE ${s.rpe}` : "—")}
                meta={
                  <div className="flex items-center gap-2">
                    {s.rpe != null && <span className="font-mono text-[11px] text-f-text2">RPE {s.rpe}</span>}
                    <Pill tone={st.tone}>{st.label}</Pill>
                  </div>
                }
                action={<button className="f-btn-ghost" title="Editar"><span className="material-symbols-outlined" style={{ fontSize: 17 }}>edit</span></button>}
              />
            </div>
          );
        })}
      </div>
      <p className="text-[12px] text-f-text3 mt-3">Podés corregir estado, RPE o agregar notas retroactivamente — el bot las usa de contexto.</p>
    </>
  );
}

/* ---------------- 3.3 Records personales ---------------- */
function PRs() {
  const { data } = useProfileData();
  const [prs, setPrs] = useState(data.personalRecords);
  const [adding, setAdding] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);

  return (
    <>
      <div className="flex justify-end mb-4">
        <button className="f-btn f-btn-primary f-btn-sm" onClick={() => setAdding(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span> Agregar PR
        </button>
      </div>
      <div className="f-card !p-0 divide-y divide-f-border">
        {prs.map((pr) => (
          <div key={pr.id} className="px-5">
            <Row
              icon="trophy"
              iconTone="gold"
              title={pr.exercise}
              sub={<span className="font-mono text-[11px]">{pr.date}</span>}
              meta={<span className="font-sans font-bold text-[18px] text-f-gold">{pr.mark}</span>}
              action={
                <div className="flex">
                  <button className="f-btn-ghost"><span className="material-symbols-outlined" style={{ fontSize: 17 }}>edit</span></button>
                  <button className="f-btn-ghost text-f-red-light" onClick={() => setToDelete(pr.id)}><span className="material-symbols-outlined" style={{ fontSize: 17 }}>delete</span></button>
                </div>
              }
            />
          </div>
        ))}
      </div>

      {adding && (
        <Sheet
          open
          title="Agregar PR"
          onClose={() => setAdding(false)}
          footer={
            <div className="grid grid-cols-2 gap-2">
              <button className="f-btn f-btn-secondary" onClick={() => setAdding(false)}>Cancelar</button>
              <button className="f-btn f-btn-primary" onClick={() => { setPrs((p) => [...p, { id: crypto.randomUUID(), exercise: "Nuevo ejercicio", mark: "—", date: "2026-05-16" }]); setAdding(false); }}>Guardar PR</button>
            </div>
          }
        >
          <div><label className="f-label">Ejercicio</label><input className="f-input" placeholder="Ej: Sentadilla / 10 km / 1.500 m" /></div>
          <div><label className="f-label">Marca</label><input className="f-input" placeholder="Ej: 95 kg · 24:18 · 31:40" /></div>
          <div><label className="f-label">Fecha</label><input className="f-input" type="date" defaultValue="2026-05-16" /></div>
        </Sheet>
      )}
      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar PR"
        danger
        confirmLabel="Eliminar"
        body="Se quitará del Journey si aparecía ahí. ¿Confirmás?"
        onConfirm={() => setPrs((p) => p.filter((x) => x.id !== toDelete))}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
