import { useEffect, useRef, useState } from "react";
import { useProfileData } from "../api/store";
import { injuryToDb } from "../api/transformers";
import { SectionHeader, Tabs, Pill, Row, ConfirmDialog, Sheet, Callout, EmptyState, toast } from "../components/ui";
import { AreaChart, LineChart } from "../components/charts";

type Tab = "datos" | "lesiones" | "clinico" | "documentos";

export function Health() {
  const [tab, setTab] = useState<Tab>("datos");
  return (
    <>
      <SectionHeader
        eyebrow="Salud y Cuerpo"
        title="El diferenciador clínico"
        lede="Datos que llevás al kinesiólogo y al médico. Forja los guarda y los grafica — ninguna otra app te da esto."
      />
      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "datos", label: "Datos corporales" },
          { value: "lesiones", label: "Lesiones" },
          { value: "clinico", label: "Crónicas y medicación" },
          { value: "documentos", label: "Documentos clínicos" },
        ]}
      />
      {tab === "datos" && <BodyData />}
      {tab === "lesiones" && <Injuries />}
      {tab === "clinico" && <Clinical />}
      {tab === "documentos" && <Docs />}
    </>
  );
}

/* ---------------- 4.1 Datos corporales ---------------- */
function BodyData() {
  const { data, updateBody, source } = useProfileData();
  const b = data.bodyData;
  const imc = b.heightCm ? +(b.currentWeight / (b.heightCm / 100) ** 2).toFixed(1) : 0;
  const delta = b.weightHistory.length > 1
    ? +(b.weightHistory.at(-1)!.kg - b.weightHistory[0].kg).toFixed(1)
    : 0;
  const [vals, setVals] = useState<{ weight: string; fat: string; height: string }>({ weight: "", fat: "", height: "" });
  const [busy, setBusy] = useState<string | null>(null);

  const commit = async (key: "weight_kg" | "body_fat_pct" | "height_cm", raw: string) => {
    const n = Number(raw);
    if (!raw || Number.isNaN(n) || n <= 0) { toast("Valor inválido", "error"); return; }
    setBusy(key);
    try {
      await updateBody({ [key]: n });
      toast("Dato actualizado");
      setVals((v) => ({ ...v, [key === "weight_kg" ? "weight" : key === "body_fat_pct" ? "fat" : "height"]: "" }));
    } catch (e) {
      toast((e as Error).message || "No se pudo guardar", "error");
    } finally {
      setBusy(null);
    }
  };

  const fields = [
    { l: "Actualizar peso", ph: String(b.currentWeight), u: "kg", k: "weight_kg" as const, val: vals.weight, set: (x: string) => setVals((v) => ({ ...v, weight: x })) },
    { l: "Actualizar % graso", ph: String(b.bodyFat), u: "%", k: "body_fat_pct" as const, val: vals.fat, set: (x: string) => setVals((v) => ({ ...v, fat: x })) },
    { l: "Editar altura", ph: String(b.heightCm), u: "cm", k: "height_cm" as const, val: vals.height, set: (x: string) => setVals((v) => ({ ...v, height: x })) },
  ];

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-4">
        {[
          { l: "Peso actual", v: `${b.currentWeight} kg`, s: delta ? `${delta > 0 ? "+" : ""}${delta} kg` : "última carga", tone: delta < 0 ? "#5B8A64" : "#C49A3C" },
          { l: "Altura", v: `${b.heightCm} cm`, s: "editable", tone: "#D4CFC4" },
          { l: "% graso", v: `${b.bodyFat}%`, s: "última carga", tone: "#D4CFC4" },
          { l: "IMC", v: imc, s: "informativo", tone: "#8A8680" },
        ].map((x) => (
          <div key={x.l} className="f-card">
            <div className="font-sans font-bold text-[20px] sm:text-[22px]" style={{ color: x.tone }}>{x.v}</div>
            <div className="f-datalabel mt-1">{x.l}</div>
            <div className="font-mono text-[10px] text-f-text3 mt-0.5">{x.s}</div>
          </div>
        ))}
      </div>

      <div className="f-card mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="f-datalabel">Evolución de peso</span>
          <span className="font-mono text-[11px] text-f-green-light">{delta} kg</span>
        </div>
        <AreaChart data={b.weightHistory.map((w) => w.kg)} color="#5B8A64" height={150} />
        <div className="flex justify-between mt-2 font-mono text-[9px] text-f-text3">
          <span>{b.weightHistory[0]?.date}</span><span>{b.weightHistory.at(-1)?.date}</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {fields.map((f) => (
          <div key={f.l} className="f-card">
            <label className="f-label">{f.l}</label>
            <div className="flex gap-2">
              <div className="f-field flex-1">
                <input className="f-input has-suffix" type="number" placeholder={f.ph} value={f.val} onChange={(e) => f.set(e.target.value)} />
                <span className="f-suffix">{f.u}</span>
              </div>
              <button className="f-btn f-btn-primary f-btn-sm" disabled={busy === f.k || source !== "live"} onClick={() => commit(f.k, f.val)}>
                {busy === f.k ? "…" : "OK"}
              </button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[12px] text-f-text3 mt-3">
        {source === "live" ? "Cada actualización se registra con fecha." : "Actualizar requiere conexión al backend."}
      </p>
    </>
  );
}

/* ---------------- 4.2 Lesiones ---------------- */
type UIInjury = typeof import("../data/mock").activeInjuries[number];

function Injuries() {
  const { data, saveMedical, source } = useProfileData();
  const [injuries, setInjuries] = useState<UIInjury[]>(data.activeInjuries);
  const [adding, setAdding] = useState(false);
  const [resolve, setResolve] = useState<UIInjury | null>(null);
  const [chartFor, setChartFor] = useState<string | null>(data.activeInjuries[0]?.id ?? null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setInjuries(data.activeInjuries);
    setChartFor((c) => c ?? data.activeInjuries[0]?.id ?? null);
  }, [data.activeInjuries]);

  const persist = async (active: UIInjury[], extraPast?: UIInjury) => {
    if (source !== "live") { setInjuries(active); return; }
    setBusy(true);
    try {
      const pastDb = data.pastInjuries.map((p) => ({ description: p.area, type: "lesión", year: Number(p.from?.slice(0, 4)) || new Date().getFullYear() }));
      if (extraPast) pastDb.push({ description: extraPast.area, type: "resuelta", year: new Date().getFullYear() });
      await saveMedical({
        active_injuries: active.map(injuryToDb),
        past_injuries: pastDb,
      });
      toast("Lesiones guardadas");
    } catch (e) {
      toast((e as Error).message || "No se pudo guardar", "error");
    } finally {
      setBusy(false);
    }
  };

  const setPain = (id: string, pain: number) =>
    setInjuries((p) => p.map((x) => (x.id === id ? { ...x, pain } : x)));

  return (
    <>
      <div className="flex justify-end mb-4">
        <button className="f-btn f-btn-primary f-btn-sm" disabled={busy} onClick={() => setAdding(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span> Agregar lesión
        </button>
      </div>

      <div className="f-datalabel mb-2">Activas</div>
      {injuries.length === 0 && <EmptyState icon="healing" title="Sin lesiones activas" hint="Agregá una o reportala al bot por WhatsApp." />}
      {injuries.map((inj) => (
        <div key={inj.id} className="f-card mb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined flex-none rounded-lg flex items-center justify-center" style={{ width: 40, height: 40, background: "rgba(122,40,50,0.15)", color: "#A8404D", fontSize: 21 }}>bolt</span>
              <div>
                <div className="text-[15px] font-medium text-f-text">{inj.area}</div>
                <div className="text-[12px] text-f-text2 mt-0.5">{inj.desc}</div>
              </div>
            </div>
            {inj.treatment && <Pill tone="green">En tratamiento</Pill>}
          </div>

          <div className="mt-4">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-[13px] text-f-text2">Dolor actual</span>
              <span className="font-sans font-bold text-[18px]" style={{ color: inj.pain >= 7 ? "#A8404D" : inj.pain >= 4 ? "#C49A3C" : "#5B8A64" }}>{inj.pain}/10</span>
            </div>
            <input
              type="range" min={0} max={10} value={inj.pain}
              onChange={(e) => setPain(inj.id, Number(e.target.value))}
              onPointerUp={() => persist(injuries)}
              onKeyUp={() => persist(injuries)}
              className="w-full accent-[#7A2832]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 text-[12px]">
            <div><span className="f-datalabel">Inicio</span><div className="text-f-text mt-1 font-mono text-[12px]">{inj.since}</div></div>
            <div><span className="f-datalabel">Tratamiento</span><div className="text-f-text mt-1">{inj.treatmentDesc}</div></div>
          </div>

          <div className="flex gap-2 mt-4">
            <button className="f-btn f-btn-secondary f-btn-sm flex-1" onClick={() => setChartFor(chartFor === inj.id ? null : inj.id)}>
              {chartFor === inj.id ? "Ocultar" : "Ver"} evolución del dolor
            </button>
            <button className="f-btn f-btn-secondary f-btn-sm" disabled={busy} onClick={() => setResolve(inj)}>Marcar resuelta</button>
          </div>

          {chartFor === inj.id && (
            <div className="mt-4 pt-4 border-t border-f-border f-fade-up">
              <span className="f-datalabel">Dolor reportado a lo largo del tiempo</span>
              <div className="mt-3">
                <LineChart
                  height={140}
                  labels={inj.painHistory.map((h) => h.date.slice(5))}
                  series={[{ data: inj.painHistory.map((h) => h.v), color: "#A8404D" }]}
                />
              </div>
              <p className="text-[11px] text-f-text3 mt-2">Esta es la info que llevás al kinesiólogo.</p>
            </div>
          )}
        </div>
      ))}

      <div className="f-datalabel mb-2 mt-6">Pasadas / resueltas</div>
      <div className="f-card !p-0 divide-y divide-f-border">
        {data.pastInjuries.length === 0 && <div className="px-5 py-4 text-[13px] text-f-text3">Sin lesiones pasadas.</div>}
        {data.pastInjuries.map((p) => (
          <div key={p.id} className="px-5">
            <Row icon="check_circle" iconTone="green" title={p.area} sub={`${p.from} → ${p.to}`} meta={<span className="font-mono text-[12px] text-f-text2">{p.days} días</span>} />
          </div>
        ))}
      </div>

      {adding && (
        <AddInjury
          onClose={() => setAdding(false)}
          onSave={(inj) => { setAdding(false); persist([...injuries, inj]); }}
        />
      )}
      <ConfirmDialog
        open={!!resolve}
        title="Marcar lesión como resuelta"
        confirmLabel="Marcar resuelta"
        body="Pasa a «Pasadas» con fecha de resolución de hoy. Podés reabrirla si reaparece."
        onConfirm={() => {
          if (resolve) persist(injuries.filter((x) => x.id !== resolve.id), resolve);
        }}
        onClose={() => setResolve(null)}
      />
    </>
  );
}

function AddInjury({ onClose, onSave }: { onClose: () => void; onSave: (i: UIInjury) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [area, setArea] = useState("");
  const [desc, setDesc] = useState("");
  const [pain, setPain] = useState(5);
  const [since, setSince] = useState(today);
  const [treatment, setTreatment] = useState(false);
  const [treatmentDesc, setTreatmentDesc] = useState("");

  return (
    <Sheet
      open
      title="Agregar lesión"
      onClose={onClose}
      footer={
        <div className="grid grid-cols-2 gap-2">
          <button className="f-btn f-btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            className="f-btn f-btn-primary"
            disabled={!area.trim()}
            onClick={() => onSave({
              id: crypto.randomUUID(), area: area.trim(), desc: desc.trim(),
              pain, since, treatment, treatmentDesc: treatmentDesc.trim() || "—",
              painHistory: [{ date: since, v: pain }],
            })}
          >
            Guardar
          </button>
        </div>
      }
    >
      <div><label className="f-label">Ubicación corporal</label><input className="f-input" value={area} placeholder="Ej: Aquiles derecho" onChange={(e) => setArea(e.target.value)} /></div>
      <div><label className="f-label">Descripción</label><textarea className="f-input" value={desc} placeholder="Qué sentís, cómo apareció…" onChange={(e) => setDesc(e.target.value)} /></div>
      <div>
        <label className="f-label">Dolor actual ({pain}/10)</label>
        <input type="range" min={0} max={10} value={pain} className="w-full accent-[#7A2832]" onChange={(e) => setPain(Number(e.target.value))} />
      </div>
      <div><label className="f-label">Fecha de inicio</label><input className="f-input" type="date" value={since} onChange={(e) => setSince(e.target.value)} /></div>
      <label className="flex items-center gap-2.5 cursor-pointer">
        <input type="checkbox" checked={treatment} onChange={(e) => setTreatment(e.target.checked)} className="accent-[#5B8A64]" />
        <span className="text-[13px] text-f-text">En tratamiento</span>
      </label>
      {treatment && <div><label className="f-label">Detalle del tratamiento</label><input className="f-input" value={treatmentDesc} placeholder="Ej: Kinesiología 2x semana" onChange={(e) => setTreatmentDesc(e.target.value)} /></div>}
      <Callout icon="info">El bot usa las lesiones activas para contextualizar tus disrupciones. Si decís «me duele el aquiles», ya sabe.</Callout>
    </Sheet>
  );
}

/* ---------------- 4.3 Crónicas y medicación ---------------- */
function Clinical() {
  const { data, saveMedical, source } = useProfileData();
  const [chronic, setChronic] = useState<string[]>(data.chronic);
  const [allergies, setAllergies] = useState<string[]>(data.allergies);
  const [meds, setMeds] = useState(data.medication.map((m) => ({ ...m })));
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { setChronic(data.chronic); setAllergies(data.allergies); setMeds(data.medication.map((m) => ({ ...m }))); setDirty(false); }, [data.chronic, data.allergies, data.medication]);

  const touch = () => setDirty(true);

  const save = async () => {
    setBusy(true);
    try {
      await saveMedical({
        chronic_conditions: chronic.filter(Boolean),
        allergies: allergies.filter(Boolean),
        medications: meds.filter((m) => m.name.trim()).map((m) => ({ name: m.name, dose: m.dose, schedule: m.when })),
      });
      toast("Datos clínicos guardados");
      setDirty(false);
    } catch (e) {
      toast((e as Error).message || "No se pudo guardar", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Callout icon="info">Datos de referencia clínica. El bot los usa para no sugerirte acciones incompatibles (ej: no te recomienda ibuprofeno si declaraste problemas gástricos).</Callout>
      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <StringBlock title="Condiciones crónicas" icon="monitor_heart" items={chronic} onChange={(v) => { setChronic(v); touch(); }} placeholder="Ej: Asma leve" />
        <div className="f-card">
          <div className="flex items-center justify-between mb-3">
            <span className="f-datalabel">Medicación actual</span>
            <button className="f-btn-ghost text-f-green-light" onClick={() => { setMeds((p) => [...p, { name: "", dose: "", when: "" }]); touch(); }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {meds.length === 0 && <span className="text-[13px] text-f-text3">Sin registros.</span>}
            {meds.map((m, i) => (
              <div key={i} className="bg-f-surface border border-f-border rounded-lg px-3 py-2.5 flex flex-col gap-1.5">
                <div className="flex gap-1.5">
                  <input className="f-input !h-8 text-[12px]" value={m.name} placeholder="Nombre" onChange={(e) => { setMeds((p) => p.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x)); touch(); }} />
                  <button className="f-btn-ghost !p-1 text-f-red-light flex-none" onClick={() => { setMeds((p) => p.filter((_, idx) => idx !== i)); touch(); }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                  </button>
                </div>
                <div className="flex gap-1.5">
                  <input className="f-input !h-8 text-[12px]" value={m.dose} placeholder="Dosis" onChange={(e) => { setMeds((p) => p.map((x, idx) => idx === i ? { ...x, dose: e.target.value } : x)); touch(); }} />
                  <input className="f-input !h-8 text-[12px]" value={m.when} placeholder="Cuándo" onChange={(e) => { setMeds((p) => p.map((x, idx) => idx === i ? { ...x, when: e.target.value } : x)); touch(); }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <StringBlock title="Alergias alimentarias" icon="warning" items={allergies} onChange={(v) => { setAllergies(v); touch(); }} placeholder="Ej: Maní" />
      </div>
      <div className="mt-4 flex justify-end">
        <button className="f-btn f-btn-primary f-btn-sm" disabled={busy || !dirty || source !== "live"} onClick={save}>
          {busy ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
      {source !== "live" && <p className="text-[11px] text-f-text3 mt-2 text-right">Guardar requiere conexión al backend.</p>}
    </>
  );
}

function StringBlock({
  title, icon, items, onChange, placeholder,
}: { title: string; icon: string; items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState("");
  return (
    <div className="f-card">
      <div className="flex items-center justify-between mb-3">
        <span className="f-datalabel">{title}</span>
      </div>
      <div className="flex gap-1.5 mb-2">
        <input
          className="f-input !h-9 text-[13px]" value={draft} placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && draft.trim()) { onChange([...items, draft.trim()]); setDraft(""); } }}
        />
        <button className="f-btn f-btn-secondary f-btn-sm flex-none" disabled={!draft.trim()} onClick={() => { onChange([...items, draft.trim()]); setDraft(""); }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {items.length === 0 && <span className="text-[13px] text-f-text3">Sin registros.</span>}
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2.5 bg-f-surface border border-f-border rounded-lg px-3 py-2.5">
            <span className="material-symbols-outlined text-f-text2" style={{ fontSize: 18 }}>{icon}</span>
            <span className="flex-1 text-[13px] text-f-text">{it}</span>
            <button className="f-btn-ghost !p-1 text-f-red-light" onClick={() => onChange(items.filter((_, idx) => idx !== i))}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- 4.4 Documentos clínicos ---------------- */
const DOC_TYPES: { label: string; slot: string }[] = [
  { label: "Electrocardiograma", slot: "ecg" },
  { label: "Radiografía", slot: "xray" },
  { label: "Resonancia", slot: "xray" },
  { label: "Análisis de sangre", slot: "blood_work" },
  { label: "Apto médico", slot: "medical_clearance" },
  { label: "Otro", slot: "other" },
];

function Docs() {
  const { documents, uploadDocument, deleteDocument, documentFileUrl, source } = useProfileData();
  const [del, setDel] = useState<string | null>(null);
  const [docType, setDocType] = useState(DOC_TYPES[0].label);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const slot = DOC_TYPES.find((d) => d.label === docType)?.slot ?? "other";
    setBusy(true);
    try { await uploadDocument(f, slot, docType); toast("Documento subido"); }
    catch (err) { toast((err as Error).message || "No se pudo subir", "error"); }
    finally { setBusy(false); }
  };

  const fmtSize = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

  return (
    <>
      <div className="f-card mb-4">
        <label className="f-label">Subir nuevo documento</label>
        <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
          <select className="f-input" value={docType} onChange={(e) => setDocType(e.target.value)}>
            {DOC_TYPES.map((d) => <option key={d.label} value={d.label}>{d.label}</option>)}
          </select>
          <input ref={fileRef} type="file" accept=".pdf,image/*" className="hidden" onChange={onPick} />
          <button className="f-btn f-btn-primary f-btn-sm" disabled={busy || source !== "live"} onClick={() => fileRef.current?.click()}>
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>upload</span>
            {busy ? "Subiendo…" : "Elegir archivo"}
          </button>
        </div>
        {source !== "live" && <p className="text-[11px] text-f-text3 mt-2">Subir documentos requiere conexión al backend.</p>}
      </div>

      <div className="f-card !p-0 divide-y divide-f-border">
        {documents.length === 0 && <div className="px-5 py-5 text-[13px] text-f-text3 text-center">Sin documentos clínicos cargados.</div>}
        {documents.map((d) => {
          const isImage = d.raw_file_mime.startsWith("image/");
          const url = documentFileUrl(d.id);
          return (
            <div key={d.id} className="px-5">
              <Row
                icon={isImage ? "image" : "description"}
                title={d.doc_type}
                sub={<span className="font-mono text-[11px]">{d.created_at.slice(0, 10)} · {fmtSize(d.raw_file_size)} · {d.raw_file_name}</span>}
                action={
                  <div className="flex">
                    {url && (
                      <a className="f-btn-ghost" title="Descargar" href={url} target="_blank" rel="noreferrer">
                        <span className="material-symbols-outlined" style={{ fontSize: 17 }}>download</span>
                      </a>
                    )}
                    <button className="f-btn-ghost text-f-red-light" title="Eliminar" onClick={() => setDel(d.id)}>
                      <span className="material-symbols-outlined" style={{ fontSize: 17 }}>delete</span>
                    </button>
                  </div>
                }
              />
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <Callout icon="lock">Forja NO procesa ni interpreta documentos clínicos. Se almacenan como referencia para vos y tu equipo profesional.</Callout>
      </div>

      <ConfirmDialog
        open={!!del}
        title="Eliminar documento"
        danger
        confirmLabel="Eliminar"
        body="El archivo se borra de forma permanente. ¿Confirmás?"
        onConfirm={async () => {
          if (!del) return;
          try { await deleteDocument(del); toast("Documento eliminado"); }
          catch (e) { toast((e as Error).message || "No se pudo eliminar", "error"); }
        }}
        onClose={() => setDel(null)}
      />
    </>
  );
}
