import { useEffect, useState } from "react";
import { useProfileData } from "../api/store";
import { waActions } from "../lib/whatsapp";
import type { DbPreferences } from "../api/client";
import { SectionHeader, Tabs, Toggle, Segmented, Row, ConfirmDialog, Callout, Pill, toast } from "../components/ui";

type Tab = "recordatorios" | "personalidad" | "privacidad" | "datos" | "conexiones";

export function Settings() {
  const [tab, setTab] = useState<Tab>("recordatorios");
  return (
    <>
      <SectionHeader eyebrow="Configuración" title="El centro de control del bot" lede="Todo lo que ajustás acá cambia cómo y cuándo el bot te habla por WhatsApp." />
      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "recordatorios", label: "Recordatorios" },
          { value: "personalidad", label: "Personalidad" },
          { value: "privacidad", label: "Privacidad" },
          { value: "datos", label: "Datos personales" },
          { value: "conexiones", label: "Conexiones" },
        ]}
      />
      {tab === "recordatorios" && <Reminders />}
      {tab === "personalidad" && <Personality />}
      {tab === "privacidad" && <Privacy />}
      {tab === "datos" && <PersonalData />}
      {tab === "conexiones" && <Connections />}
    </>
  );
}

function useSavePrefs() {
  const { preferences, savePreferences, source } = useProfileData();
  const [busy, setBusy] = useState(false);
  const persist = async (patch: Partial<DbPreferences>) => {
    setBusy(true);
    try { await savePreferences({ ...preferences, ...patch }); toast("Guardado"); }
    catch (e) { toast((e as Error).message || "No se pudo guardar", "error"); }
    finally { setBusy(false); }
  };
  return { preferences, persist, busy, source };
}

/* ---------------- 6.1 Recordatorios ---------------- */
function Reminders() {
  const { preferences, persist, busy, source } = useSavePrefs();
  const [list, setList] = useState(preferences.reminders ?? []);
  const [custom, setCustom] = useState(preferences.custom_reminders ?? []);
  const [quiet, setQuiet] = useState(preferences.quiet_hours ?? { from: "23:00", to: "06:00" });
  const [threshold, setThreshold] = useState(preferences.alert_threshold_pct ?? 85);

  useEffect(() => {
    setList(preferences.reminders ?? []);
    setCustom(preferences.custom_reminders ?? []);
    setQuiet(preferences.quiet_hours ?? { from: "23:00", to: "06:00" });
    setThreshold(preferences.alert_threshold_pct ?? 85);
  }, [preferences]);

  const save = () =>
    persist({ reminders: list, custom_reminders: custom, quiet_hours: quiet, alert_threshold_pct: threshold });

  return (
    <>
      <div className="f-card !p-0 divide-y divide-f-border">
        {list.map((r) => (
          <div key={r.id} className="px-4 sm:px-5 flex items-center gap-2.5 sm:gap-3 py-4">
            <div className="flex-1 min-w-0">
              <div className="text-[14px] text-f-text font-medium">{r.label}</div>
              <div className="text-[12px] text-f-text2 mt-0.5">{r.sub}</div>
            </div>
            <input type="time" value={r.time} className="f-input !h-9 !w-[92px] sm:!w-[110px] !px-2 sm:!px-3.5 text-[13px] font-mono flex-none"
              onChange={(e) => setList((p) => p.map((x) => (x.id === r.id ? { ...x, time: e.target.value } : x)))} />
            <Toggle on={r.on} label={r.label} onToggle={() => setList((p) => p.map((x) => (x.id === r.id ? { ...x, on: !x.on } : x)))} />
          </div>
        ))}
      </div>

      <div className="f-card mt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="f-datalabel">Recordatorios personalizados ({custom.length}/5)</span>
          <button className="f-btn-ghost text-f-green-light" onClick={() => custom.length < 5 && setCustom((p) => [...p, { id: crypto.randomUUID(), time: "15:00", msg: "" }])}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {custom.map((c) => (
            <div key={c.id} className="flex gap-2 items-center">
              <input type="time" value={c.time} className="f-input !h-10 !w-[92px] sm:!w-[110px] !px-2 sm:!px-3.5 text-[13px] font-mono flex-none"
                onChange={(e) => setCustom((p) => p.map((x) => (x.id === c.id ? { ...x, time: e.target.value } : x)))} />
              <input className="f-input !h-10" value={c.msg} placeholder="Ej: Tomar creatina"
                onChange={(e) => setCustom((p) => p.map((x) => (x.id === c.id ? { ...x, msg: e.target.value } : x)))} />
              <button className="f-btn-ghost text-f-red-light !p-1.5" onClick={() => setCustom((p) => p.filter((x) => x.id !== c.id))}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <div className="f-card">
          <span className="f-datalabel">Zona de silencio</span>
          <p className="text-[12px] text-f-text2 mt-1 mb-3">El bot no manda nada en este horario.</p>
          <div className="flex items-center gap-2">
            <input type="time" value={quiet.from} className="f-input !h-10 font-mono" onChange={(e) => setQuiet((q) => ({ ...q, from: e.target.value }))} />
            <span className="text-f-text3">→</span>
            <input type="time" value={quiet.to} className="f-input !h-10 font-mono" onChange={(e) => setQuiet((q) => ({ ...q, to: e.target.value }))} />
          </div>
        </div>
        <div className="f-card">
          <span className="f-datalabel">Umbral de alerta nutricional</span>
          <p className="text-[12px] text-f-text2 mt-1 mb-3">Avisa si kcal &lt; este % del target.</p>
          <div className="f-field"><input className="f-input has-suffix" type="number" value={threshold} onChange={(e) => setThreshold(Number(e.target.value) || 0)} /><span className="f-suffix">%</span></div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button className="f-btn f-btn-primary f-btn-sm" disabled={busy || source !== "live"} onClick={save}>
          {busy ? "Guardando…" : "Guardar recordatorios"}
        </button>
      </div>
      {source !== "live" && <p className="text-[11px] text-f-text3 mt-2 text-right">Guardar requiere conexión al backend.</p>}
    </>
  );
}

/* ---------------- 6.2 Personalidad del bot ---------------- */
function Personality() {
  const { preferences, persist, busy, source } = useSavePrefs();
  const [tone, setTone] = useState<"rocky" | "analytic" | "empathic">(preferences.bot_tone ?? "rocky");
  useEffect(() => { setTone(preferences.bot_tone ?? "rocky"); }, [preferences]);
  const samples: Record<typeof tone, string> = {
    rocky: "Hoy no se negocia. Bici Z2, 90'. Vamos.",
    analytic: "Sesión pendiente: Bici Z2 — Rodaje 90'. Horario: 12:00.",
    empathic: "¿Cómo te sentís hoy? Tenés bici Z2 a las 12, tranqui.",
  };
  return (
    <>
      <div className="f-card">
        <span className="f-datalabel">Tono del bot</span>
        <p className="text-[12px] text-f-text2 mt-1 mb-4">El cambio aplica al siguiente mensaje.</p>
        <Segmented
          value={tone}
          onChange={(v) => { setTone(v); persist({ bot_tone: v }); }}
          columns={3}
          options={[
            { value: "rocky", label: "Rocky", icon: "sports_mma" },
            { value: "analytic", label: "Analítico", icon: "analytics" },
            { value: "empathic", label: "Empático", icon: "favorite" },
          ]}
        />
      </div>
      <div className="f-card mt-4">
        <span className="f-datalabel">Así te va a hablar</span>
        <div className="mt-3 bg-f-card border border-f-border rounded-lg rounded-bl-sm p-4 max-w-[80%]">
          <div className="font-mono text-[9.5px] uppercase tracking-wide text-f-green-light mb-1.5">Forja bot</div>
          <p className="text-[14px] text-f-bone">{samples[tone]}</p>
        </div>
      </div>
      {source !== "live" && <p className="text-[11px] text-f-text3 mt-3">El tono se guarda en el backend cuando hay conexión.</p>}
      {busy && <p className="text-[11px] text-f-text3 mt-3">Guardando…</p>}
    </>
  );
}

/* ---------------- 6.3 Privacidad ---------------- */
function Privacy() {
  const { preferences, persist, busy, source } = useSavePrefs();
  const pv = preferences.privacy ?? { rank: true, community_avg: true, newsletter: false };
  const [opts, setOpts] = useState(pv);
  useEffect(() => { setOpts(preferences.privacy ?? { rank: true, community_avg: true, newsletter: false }); }, [preferences]);
  const rows: { k: keyof typeof pv; label: string }[] = [
    { k: "rank", label: "Aparecer en el ranking de Performance Score" },
    { k: "community_avg", label: "Incluir mi score (anónimo) en promedios de la comunidad" },
    { k: "newsletter", label: "Newsletter / comunicaciones de Forja" },
  ];
  const toggle = (k: keyof typeof pv) => {
    const next = { ...opts, [k]: !opts[k] };
    setOpts(next);
    persist({ privacy: next });
  };
  return (
    <>
      <div className="f-card !p-0 divide-y divide-f-border">
        {rows.map((o) => (
          <div key={o.k} className="px-5 flex items-center gap-4 py-4">
            <span className="flex-1 text-[14px] text-f-text">{o.label}</span>
            <Toggle on={opts[o.k]} label={o.label} onToggle={() => toggle(o.k)} />
          </div>
        ))}
      </div>
      {source !== "live" && <p className="text-[11px] text-f-text3 mt-3">Se guarda en el backend cuando hay conexión.</p>}
      {busy && <p className="text-[11px] text-f-text3 mt-3">Guardando…</p>}
    </>
  );
}

/* ---------------- 6.4 Datos personales ---------------- */
function PersonalData() {
  const { data, raw, updateIdentity, deleteAccount, exportUrl, source } = useProfileData();
  const { athlete } = data;
  const id = raw.identity;
  const [form, setForm] = useState({
    name: id?.name ?? athlete.name,
    age: String(id?.age ?? athlete.age),
    sex: (id?.sex ?? "X") as "M" | "F" | "X",
    email: id?.email ?? athlete.email,
    phone_wa: id?.phone_wa ?? athlete.phone,
  });
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(false);
  const [del2, setDel2] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (id) setForm({ name: id.name, age: String(id.age), sex: id.sex as "M" | "F" | "X", email: id.email, phone_wa: id.phone_wa });
  }, [id]);

  const save = async () => {
    setBusy(true);
    try {
      await updateIdentity({
        name: form.name.trim(),
        age: Number(form.age) || undefined,
        sex: form.sex,
        email: form.email.trim(),
        phone_wa: form.phone_wa.trim(),
      });
      toast("Datos personales guardados");
    } catch (e) {
      toast((e as Error).message || "No se pudo guardar", "error");
    } finally {
      setBusy(false);
    }
  };

  if (gone) {
    return <Callout icon="check_circle">Tu cuenta y todos tus datos fueron eliminados de forma permanente.</Callout>;
  }

  return (
    <>
      <div className="f-card grid sm:grid-cols-2 gap-4">
        <div>
          <label className="f-label">Nombre</label>
          <input className="f-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="f-label">Edad</label>
          <input className="f-input" type="number" value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} />
        </div>
        <div>
          <label className="f-label">Sexo</label>
          <select className="f-input" value={form.sex} onChange={(e) => setForm((f) => ({ ...f, sex: e.target.value as "M" | "F" | "X" }))}>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="X">X / Prefiero no decir</option>
          </select>
        </div>
        <div>
          <label className="f-label">Email</label>
          <input className="f-input" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </div>
        <div>
          <label className="f-label">Teléfono (WhatsApp)</label>
          <input className="f-input" value={form.phone_wa} onChange={(e) => setForm((f) => ({ ...f, phone_wa: e.target.value }))} />
        </div>
        <div className="flex items-end">
          <button className="f-btn f-btn-primary f-btn-sm" disabled={busy || source !== "live"} onClick={save}>
            {busy ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
      {source !== "live" && <p className="text-[11px] text-f-text3 mt-2">Editar requiere conexión al backend.</p>}

      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <div className="f-card">
          <div className="text-[14px] text-f-text font-medium">Exportar todos mis datos</div>
          <p className="text-[12px] text-f-text2 mt-1">JSON con todo tu historial + metadatos clínicos. Ley 25.326 (derecho de acceso).</p>
          {exportUrl ? (
            <a className="f-btn f-btn-secondary f-btn-sm mt-3 inline-flex" href={exportUrl} target="_blank" rel="noreferrer">
              <span className="material-symbols-outlined" style={{ fontSize: 17 }}>download</span> Descargar JSON
            </a>
          ) : (
            <button className="f-btn f-btn-secondary f-btn-sm mt-3" disabled>Requiere backend</button>
          )}
        </div>
        <div className="f-card-warn">
          <div className="text-[14px] text-f-red-light font-medium">Eliminar mi cuenta</div>
          <p className="text-[12px] text-f-text2 mt-1">Borra todos los datos. Irreversible. Derecho de supresión.</p>
          <button className="f-btn f-btn-danger f-btn-sm mt-3" disabled={source !== "live"} onClick={() => setDel(true)}>Eliminar cuenta</button>
        </div>
      </div>

      <ConfirmDialog
        open={del}
        title="Eliminar cuenta · paso 1 de 2"
        danger
        confirmLabel="Continuar con la baja"
        body="Vas a perder toda tu historia documentada: timeline, lesiones, PRs, Journey Cards, planes. Esto no se puede deshacer. ¿Seguro querés seguir?"
        onConfirm={() => setDel2(true)}
        onClose={() => setDel(false)}
      />
      <ConfirmDialog
        open={del2}
        title="Eliminar cuenta · paso 2 de 2"
        danger
        confirmLabel="Eliminar definitivamente"
        body="Última confirmación. Al continuar se borra tu cuenta y todos los datos asociados de forma permanente."
        onConfirm={async () => {
          try { await deleteAccount(); setGone(true); toast("Cuenta eliminada"); }
          catch (e) { toast((e as Error).message || "No se pudo eliminar", "error"); }
        }}
        onClose={() => setDel2(false)}
      />
    </>
  );
}

/* ---------------- 6.5 Conexiones ---------------- */
function Connections() {
  const { data, raw } = useProfileData();
  const { athlete } = data;
  const connected = raw.identity?.wa_connected ?? true;
  return (
    <>
      <div className="f-card">
        <Row
          icon="chat"
          iconTone="green"
          title="WhatsApp"
          sub={<>{connected ? "Conectado" : "No conectado"} · {athlete.phone}</>}
          meta={<Pill tone={connected ? "green" : "neutral"}>{connected ? "Conectado" : "Pendiente"}</Pill>}
          action={
            <a className="f-btn f-btn-secondary f-btn-sm" href={waActions.open} target="_blank" rel="noreferrer">
              {connected ? "Abrir chat" : "Conectar"}
            </a>
          }
        />
      </div>
      <div className="f-card mt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="f-datalabel">Wearables</span>
          <Pill tone="gold">Ferrari</Pill>
        </div>
        <div className="divide-y divide-f-border">
          {["Garmin Connect", "WHOOP", "Strava"].map((w) => (
            <Row key={w} icon="watch" title={w} sub="No conectado" action={<button className="f-btn f-btn-secondary f-btn-sm" disabled>Conectar</button>} />
          ))}
        </div>
      </div>
      <div className="mt-4"><Callout icon="lock">La integración de wearables se desbloquea con el plan Ferrari.</Callout></div>
    </>
  );
}
