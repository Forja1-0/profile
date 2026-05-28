import { useEffect, useMemo, useState } from "react";
import { api, currentUserId, type UserReminder } from "../api/client";
import { waActions } from "../lib/whatsapp";
import { Callout, Pill, SectionHeader, Toggle, toast } from "../components/ui";

/**
 * Pagina dedicada de recordatorios configurables.
 *
 * Se promovio a tab top-level del nav amateur porque el ICP casual no
 * quiere que el bot le ladre a las 6am — quiere armarse SUS recordatorios.
 *
 * Cada recordatorio es un cron real evaluado por el backend cada minuto
 * (cron/reminders.cron.ts). El usuario power-user puede tocar el cron
 * crudo, pero por default armamos el cron a partir de un input de horario
 * + presets de dias — para que NUNCA tenga que entender la sintaxis.
 */

type DaysPreset = "daily" | "weekdays" | "weekends" | "custom";
const DAY_LABEL: Record<DaysPreset, string> = {
  daily: "Todos los dias",
  weekdays: "Lunes a viernes",
  weekends: "Sabado y domingo",
  custom: "Dias especificos",
};

// minimo viable: la UI maneja "hora del dia + dias de la semana" -> cron.
// El cron real va a ser "<minuto> <hora> * * <dow-csv>".
function buildCron(time: string, days: DaysPreset, customDow: number[]): string {
  const [h, m] = time.split(":");
  const hour = Number(h ?? 0);
  const minute = Number(m ?? 0);
  const dowMap: Record<Exclude<DaysPreset, "custom">, string> = {
    daily: "*",
    weekdays: "1-5",
    weekends: "0,6",
  };
  const dow =
    days === "custom"
      ? customDow.length
        ? customDow.sort().join(",")
        : "*"
      : dowMap[days];
  return `${minute} ${hour} * * ${dow}`;
}

const DOW_LABEL = ["D", "L", "M", "M", "J", "V", "S"];

export function Reminders() {
  const userId = currentUserId();
  const [items, setItems] = useState<UserReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    label: "",
    message: "",
    time: "13:00",
    days: "daily" as DaysPreset,
    customDow: [] as number[],
  });

  const cronExpr = useMemo(
    () => buildCron(form.time, form.days, form.customDow),
    [form.time, form.days, form.customDow],
  );

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    api
      .listReminders(userId)
      .then((r) => {
        if (alive) setItems(r.reminders);
      })
      .catch(() => {
        if (alive) toast("No pude cargar los recordatorios", "error");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [userId]);

  if (!userId) {
    return (
      <>
        <SectionHeader
          eyebrow="Recordatorios"
          title={<>Para crear recordatorios <span className="font-serif italic">entrá desde WhatsApp</span>.</>}
          lede="Necesitamos saber quien sos para mandarte los recordatorios al WhatsApp correcto."
        />
        <div className="f-card">
          <p className="text-[14px] text-f-text mb-3">
            Abrí Forja en WhatsApp y escribí <b>perfil</b>. Te llega un link unico
            que abre esta pagina con tu cuenta.
          </p>
          <a href={waActions.open} target="_blank" rel="noreferrer" className="f-btn f-btn-wa">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chat</span>
            Abrir Forja en WhatsApp
          </a>
        </div>
      </>
    );
  }

  const canSubmit = form.label.trim() && form.message.trim() && cronExpr.trim();

  const submit = async () => {
    if (!canSubmit) return;
    setCreating(true);
    try {
      const r = await api.createReminder(userId, {
        label: form.label.trim(),
        message: form.message.trim(),
        cron_expr: cronExpr,
      });
      setItems((p) => [r.reminder, ...p]);
      setForm({ label: "", message: "", time: "13:00", days: "daily", customDow: [] });
      toast("Recordatorio creado");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "no pude crear";
      toast(msg.includes("cron") ? "Horario invalido" : "Error al crear", "error");
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (r: UserReminder) => {
    try {
      const upd = await api.updateReminder(userId, r.id, { active: !r.active });
      setItems((p) => p.map((x) => (x.id === r.id ? upd.reminder : x)));
    } catch {
      toast("No pude actualizar", "error");
    }
  };

  const remove = async (r: UserReminder) => {
    if (!confirm(`Eliminar "${r.label}"?`)) return;
    try {
      await api.deleteReminder(userId, r.id);
      setItems((p) => p.filter((x) => x.id !== r.id));
      toast("Eliminado");
    } catch {
      toast("No pude borrar", "error");
    }
  };

  const toggleDow = (n: number) =>
    setForm((f) => ({
      ...f,
      customDow: f.customDow.includes(n) ? f.customDow.filter((x) => x !== n) : [...f.customDow, n],
    }));

  return (
    <>
      <SectionHeader
        eyebrow="Recordatorios"
        title={<>Lo que <span className="font-serif italic">querés que te recuerde</span>.</>}
        lede="Crea tus propios recordatorios. Forja te los manda por WhatsApp en el horario que vos elijas."
      />

      <div className="f-card">
        <div className="f-datalabel mb-3">Nuevo recordatorio</div>
        <div className="flex flex-col gap-3">
          <div>
            <label className="f-label">Titulo</label>
            <input
              className="f-input"
              placeholder="Tomar creatina"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
          </div>
          <div>
            <label className="f-label">Mensaje que llega al WhatsApp</label>
            <input
              className="f-input"
              placeholder="Che, tomá la creatina con un vaso de agua."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="f-label">Hora</label>
              <input
                type="time"
                className="f-input font-mono"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
            </div>
            <div>
              <label className="f-label">Dias</label>
              <select
                className="f-input"
                value={form.days}
                onChange={(e) => setForm({ ...form, days: e.target.value as DaysPreset })}
              >
                {(Object.keys(DAY_LABEL) as DaysPreset[]).map((k) => (
                  <option key={k} value={k}>
                    {DAY_LABEL[k]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {form.days === "custom" && (
            <div>
              <label className="f-label">Elegí los dias</label>
              <div className="flex gap-1.5">
                {DOW_LABEL.map((lbl, idx) => {
                  const on = form.customDow.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleDow(idx)}
                      className={`flex-1 h-10 rounded-lg border text-[13px] font-medium transition ${
                        on
                          ? "border-f-green-light bg-f-green-dark text-f-text"
                          : "border-f-border text-f-text2 hover:bg-f-surface"
                      }`}
                    >
                      {lbl}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <p className="f-helper">
            Se va a disparar:{" "}
            <span className="text-f-text">
              {DAY_LABEL[form.days].toLowerCase()} a las {form.time}
            </span>
            .
          </p>

          <button
            className="f-btn f-btn-primary"
            onClick={submit}
            disabled={!canSubmit || creating}
          >
            {creating ? "Creando…" : "Crear recordatorio"}
          </button>
        </div>
      </div>

      <div className="f-card mt-3 sm:mt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="f-datalabel">Tus recordatorios</span>
          <Pill tone="neutral">{items.length}</Pill>
        </div>
        {loading && <p className="text-[13px] text-f-text3">Cargando…</p>}
        {!loading && items.length === 0 && (
          <p className="text-[13px] text-f-text3">
            Todavia no tenés ninguno. Creá uno arriba.
          </p>
        )}
        <div className="flex flex-col gap-2">
          {items.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 bg-f-surface rounded-lg px-3.5 py-2.5 border border-f-border"
            >
              <div className="flex-1 min-w-0">
                <div className="text-[14px] text-f-text font-medium truncate">{r.label}</div>
                <div className="text-[12px] text-f-text2 truncate">{r.message}</div>
                <div className="font-mono text-[11px] text-f-text3 mt-1">{r.cron_expr}</div>
              </div>
              <Toggle on={r.active} onToggle={() => toggleActive(r)} />
              <button
                className="f-btn-ghost"
                onClick={() => remove(r)}
                aria-label="Eliminar"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  delete
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 sm:mt-4">
        <Callout icon="schedule">
          Los horarios estan en la zona Argentina/Buenos_Aires. Si no te llega
          cuando esperabas, revisa que el WhatsApp del bot tenga tu numero.
        </Callout>
      </div>
    </>
  );
}
