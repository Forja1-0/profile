import { useState } from "react";
import { subscription, planMatrix, type Plan } from "../data/mock";
import { SectionHeader, Tabs, Pill, ConfirmDialog, Callout } from "../components/ui";

type Tab = "estado" | "planes" | "referidos";

const PLAN_META: Record<Plan, { name: string; price: string; tone: "neutral" | "green" | "gold"; color: string }> = {
  toyota: { name: "Toyota", price: "Gratis", tone: "neutral", color: "#8A8680" },
  audi: { name: "Audi", price: "$14.99/mes", tone: "green", color: "#5B8A64" },
  ferrari: { name: "Ferrari", price: "$19.99/mes", tone: "gold", color: "#C9A24B" },
};

export function Subscription() {
  const [tab, setTab] = useState<Tab>("estado");
  return (
    <>
      <SectionHeader eyebrow="Suscripción" title="Transparencia total" lede="Sin letra chica. Ver exactamente qué pagás y qué tenés es lo que reduce el churn." />
      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "estado", label: "Estado de la cuenta" },
          { value: "planes", label: "Comparar planes" },
          { value: "referidos", label: "Referidos" },
        ]}
      />
      {tab === "estado" && <AccountState />}
      {tab === "planes" && <PlanCompare />}
      {tab === "referidos" && <Referrals />}
    </>
  );
}

/* ---------------- 7.1 Estado de la cuenta ---------------- */
function AccountState() {
  const [cancel, setCancel] = useState(false);
  const m = PLAN_META[subscription.plan];
  return (
    <>
      <div className="f-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="rounded-xl flex items-center justify-center font-sans font-bold" style={{ width: 56, height: 56, background: "rgba(58,90,64,0.18)", color: m.color, fontSize: 22 }}>
              {m.name[0]}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-sans font-bold text-[20px] text-f-text">Plan {m.name}</span>
                <Pill tone={m.tone}>{m.price}</Pill>
              </div>
              <div className="font-mono text-[11px] text-f-text2 mt-1">Desde {subscription.since}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="f-datalabel">Próximo cobro</div>
            <div className="text-[15px] text-f-text mt-1">{subscription.nextCharge} · {subscription.amount}</div>
          </div>
        </div>
        <div className="mt-5 pt-5 border-t border-f-border flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-[13px] text-f-text2">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>credit_card</span>
            {subscription.card.brand} ···· {subscription.card.last4}
          </div>
          {/* En mobile la acción primaria ocupa toda la fila; las secundarias quedan juntas */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button className="f-btn f-btn-primary w-full sm:w-auto">Upgrade a Ferrari</button>
            <div className="flex gap-2 w-full sm:w-auto">
              <button className="f-btn f-btn-secondary f-btn-sm flex-1 sm:flex-none">Downgrade</button>
              <button className="f-btn f-btn-danger f-btn-sm flex-1 sm:flex-none" onClick={() => setCancel(true)}>Cancelar</button>
            </div>
          </div>
        </div>
      </div>

      <div className="f-card mt-4 !p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-f-border f-datalabel">Historial de pagos</div>
        <div className="f-scroll-x">
          <table className="f-table min-w-[360px]">
            <thead><tr><th>Fecha</th><th>Monto</th><th>Estado</th></tr></thead>
            <tbody>
              {subscription.payments.map((p) => (
                <tr key={p.date}>
                  <td>{p.date}</td><td>{p.amount}</td>
                  <td style={{ color: p.status === "Pagado" ? "#5B8A64" : "#8A8680" }}>{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={cancel}
        title="Cancelar suscripción · paso 1 de 2"
        danger
        confirmLabel="Continuar con la baja"
        body="No perdés tu data: tu perfil pasa a Toyota (gratis) con features limitadas. Podés volver cuando quieras."
        onConfirm={() => {}}
        onClose={() => setCancel(false)}
      />
    </>
  );
}

/* ---------------- 7.2 Comparación de planes ---------------- */
function Cell({ v }: { v: boolean | string }) {
  if (v === true) return <span className="material-symbols-outlined text-f-green-light" style={{ fontSize: 18 }}>check</span>;
  if (v === false) return <span className="text-f-text3">—</span>;
  return <span className="font-mono text-[11px] text-f-gold">{v}</span>;
}
function PlanCompare() {
  return (
    <>
      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        {(Object.keys(PLAN_META) as Plan[]).map((p) => {
          const m = PLAN_META[p];
          const current = p === subscription.plan;
          return (
            <div key={p} className="f-card text-center" style={{ borderColor: current ? "rgba(91,138,100,0.4)" : undefined }}>
              <div className="font-sans font-bold text-[18px]" style={{ color: m.color }}>{m.name}</div>
              <div className="font-mono text-[13px] text-f-text2 mt-1">{m.price}</div>
              {current ? <Pill tone="green">Tu plan</Pill> : <button className="f-btn f-btn-secondary f-btn-sm mt-3 w-full">{p === "ferrari" ? "Upgrade" : p === "toyota" ? "Downgrade" : "Elegir"}</button>}
            </div>
          );
        })}
      </div>

      <div className="f-card !p-0 overflow-hidden f-scroll-x">
        <table className="f-table min-w-[560px]">
          <thead><tr><th>Feature</th><th>Toyota</th><th>Audi</th><th>Ferrari</th></tr></thead>
          <tbody>
            {planMatrix.map((r) => (
              <tr key={r.feature}>
                <td className="!text-left !font-sans !text-[13px] text-f-text">{r.feature}</td>
                <td><Cell v={r.toyota} /></td>
                <td><Cell v={r.audi} /></td>
                <td><Cell v={r.ferrari} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[12px] text-f-text3 mt-3">Toyota→Audi: 30 días de trial gratis. Audi→Ferrari: cobro inmediato con prorrateo.</p>
    </>
  );
}

/* ---------------- 7.3 Referidos ---------------- */
function Referrals() {
  const r = subscription.referral;
  return (
    <>
      <div className="f-card">
        <span className="f-datalabel">Tu link de referido</span>
        <div className="flex gap-2 mt-2">
          <input className="f-input font-mono text-[13px]" readOnly value={`forja.app/r/${r.code}`} />
          <button className="f-btn f-btn-primary f-btn-sm flex-none"><span className="material-symbols-outlined" style={{ fontSize: 17 }}>content_copy</span> Copiar</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mt-4">
        <div className="f-card text-center"><div className="font-sans font-bold text-[24px] sm:text-[28px] text-f-text">{r.invited}</div><div className="f-datalabel mt-1">Referidas</div></div>
        <div className="f-card text-center"><div className="font-sans font-bold text-[24px] sm:text-[28px] text-f-green-light">{r.converted}</div><div className="f-datalabel mt-1">Activas (30d+)</div></div>
      </div>
      <div className="mt-4"><Callout icon="redeem">1 mes gratis de Audi por cada referido que completa 30 días activo. Llevás {r.converted} — eso son {r.converted} meses.</Callout></div>
    </>
  );
}
