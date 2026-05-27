import { useEffect, useState } from "react";
import { api, currentUserId, type UserReminder } from "../api/client";
import { Callout, Pill, SectionHeader, Toggle, toast } from "../components/ui";

/**
 * Pagina dedicada de recordatorios configurables.
 *
 * Se promovio a tab top-level del nav amateur porque el ICP casual no
 * quiere que el bot le ladre a las 6am — quiere armarse SUS recordatorios.
 *
 * Cada recordatorio es un cron real evaluado por el backend cada minuto
 * (cron/reminders.cron.ts). El usuario escribe label + mensaje + cron_expr;
 * el backend valida con node-cron antes de persistir.
 *
 * Helpers visuales para el cron_expr (ej "todos los días 14:30") quedan
 * para una siguiente iteracion — por ahora exponemos el cron crudo con
 * ejemplos visibles para que el usuario power-user lo arme a mano.
 */
export function Reminders() {
  const userId = currentUserId();
  const [items, setItems] = useState<UserReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ label: "", message: "", cron_expr: "0 13 * * *" });

  useEffect(() => {
    if (!userId) return;
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

  const canSubmit = form.label.trim() && form.message.trim() && form.cron_expr.trim();

  const submit = async () => {
    if (!canSubmit || !userId) return;
    setCreating(true);
    try {
      const r = await api.createReminder(userId, {
        label: form.label.trim(),
        message: form.message.trim(),
        cron_expr: form.cron_expr.trim(),
      });
      setItems((p) => [r.reminder, ...p]);
      setForm({ label: "", message: "", cron_expr: "0 13 * * *" });
      toast("Recordatorio creado");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "no pude crear";
      toast(msg.includes("cron") ? "Cron inválido" : "Error al crear", "error");
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (r: UserReminder) => {
    if (!userId) return;
    try {
      const upd = await api.updateReminder(userId, r.id, { active: !r.active });
      setItems((p) => p.map((x) => (x.id === r.id ? upd.reminder : x)));
    } catch {
      toast("No pude actualizar", "error");
    }
  };

  const remove = async (r: UserReminder) => {
    if (!userId) return;
    if (!confirm(`¿Eliminar "${r.label}"?`)) return;
    try {
      await api.deleteReminder(userId, r.id);
      setItems((p) => p.filter((x) => x.id !== r.id));
      toast("Eliminado");
    } catch {
      toast("No pude borrar", "error");
    }
  };

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
            <label className="f-label">Título</label>
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
          <div>
            <label className="f-label">Cron (cuándo)</label>
            <input
              className="f-input font-mono"
              placeholder="0 13 * * *"
              value={form.cron_expr}
              onChange={(e) => setForm({ ...form, cron_expr: e.target.value })}
            />
            <p className="f-helper">
              Formato de 5 campos: <span className="font-mono">minuto hora dom mes dow</span>.
              Ejemplos: <span className="font-mono">0 13 * * *</span> (todos los días 13:00),{" "}
              <span className="font-mono">0 7 * * 1-5</span> (L a V 7:00),{" "}
              <span className="font-mono">30 19 * * 1,3,5</span> (L/M/V 19:30).
            </p>
          </div>
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
            Todavía no tenés ninguno. Creá uno arriba.
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
          El cron del backend chequea cada minuto y dispara los que matcheen. Si no
          llega cuando esperabas, revisá la zona horaria (Argentina/Buenos_Aires).
        </Callout>
      </div>
    </>
  );
}
