import { useState } from "react";
import { type TLKind } from "../data/mock";
import { useProfileData } from "../api/store";
import { SectionHeader, Tabs, Pill, Stat } from "../components/ui";
import { LineChart, scoreColor } from "../components/charts";

type Tab = "timeline" | "cards" | "score";

const KIND_META: Record<TLKind, { icon: string; color: string; bg: string }> = {
  injury: { icon: "bolt", color: "#A8404D", bg: "rgba(122,40,50,0.18)" },
  slip: { icon: "local_bar", color: "#C49A3C", bg: "rgba(196,154,60,0.14)" },
  pr: { icon: "star", color: "#C9A24B", bg: "rgba(201,162,75,0.16)" },
  milestone: { icon: "trophy", color: "#abd0af", bg: "rgba(58,90,64,0.22)" },
  planchange: { icon: "swap_horiz", color: "#8A8680", bg: "#1C1C20" },
  highweek: { icon: "trending_up", color: "#5B8A64", bg: "rgba(58,90,64,0.22)" },
};

export function Journey() {
  const [tab, setTab] = useState<Tab>("timeline");
  return (
    <>
      <SectionHeader
        eyebrow="Journey"
        title={<>Tu historia, escrita con <span className="font-serif italic">datos reales</span>.</>}
        lede="No tenés que escribir tu historia deportiva. Forja la escribe por vos. Vos solo la posteás."
      />
      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "timeline", label: "Timeline de eventos" },
          { value: "cards", label: "Journey Cards" },
          { value: "score", label: "Performance Score" },
        ]}
      />
      {tab === "timeline" && <Timeline />}
      {tab === "cards" && <Cards />}
      {tab === "score" && <Score />}
    </>
  );
}

/* ---------------- 5.1 Timeline ---------------- */
function Timeline() {
  const { data } = useProfileData();
  const { journeyTotals, timeline } = data;
  return (
    <>
      {/* En mobile mostramos 4 stats por fila × 2 filas = 8 celdas pero usamos 7
          (la última queda equilibrada visualmente con 2-3-3 wrap natural). */}
      <div className="f-card mb-5 sm:mb-6 grid grid-cols-4 sm:grid-cols-7 gap-y-5 gap-x-2">
        <Stat label="Sesiones" value={journeyTotals.sessions} tone="green" />
        <Stat label="Comidas" value={journeyTotals.mealsLogged} />
        <Stat label="Streak" value={`${journeyTotals.maxStreak}d`} tone="gold" />
        <Stat label="PRs" value={journeyTotals.prs} tone="gold" />
        <Stat label="Lesiones" value={journeyTotals.injuriesBeat} tone="green" />
        <Stat label="Deslices" value={journeyTotals.slipsRecovered} tone="warn" />
        <Stat label="Sem >90" value={journeyTotals.weeksOver90} tone="green" />
      </div>

      <div className="f-card">
        <span className="f-datalabel">La historia de tu prep — desde el día 1</span>
        <div className="f-timeline mt-5">
          {timeline.map((e, i) => {
            const m = KIND_META[e.kind];
            return (
              <div key={i} className="relative pb-6 last:pb-0">
                <span className="f-tl-dot" style={{ background: m.bg }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 12, color: m.color }}>{m.icon}</span>
                </span>
                <div className="font-mono text-[10px] text-f-text3 uppercase tracking-wide">{e.date}</div>
                <div className="text-[14px] text-f-text font-medium mt-1">{e.title}</div>
                <div className="text-[12px] text-f-text2 mt-0.5 leading-[1.5]">{e.detail}</div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-[12px] text-f-text3 mt-3">Este diario deportivo se genera solo. No lo podés reconstruir en ningún otro lado — ese es el punto.</p>
    </>
  );
}

/* ---------------- 5.2 Journey Cards ---------------- */
function JourneyCardPreview() {
  const { data } = useProfileData();
  const race = data.race;
  const left = race.weekTotal - race.weekCurrent;
  return (
    <div className="f-journey p-6 pl-7">
      <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-f-green-light">Semana {race.weekCurrent} / {race.weekTotal}</div>
      <h3 className="font-serif italic text-[24px] leading-[1.25] text-f-text mt-3">
        Semana 14: el aquiles cede,<br />vos no.
      </h3>
      <div className="grid grid-cols-4 gap-3 mt-5">
        {[["5/5", "Sesiones"], ["94%", "Nutrición"], ["3/10", "Dolor ↓"], ["91", "Score"]].map(([v, l]) => (
          <div key={l}><div className="font-sans font-bold text-[20px] text-f-text">{v}</div><div className="f-datalabel mt-1">{l}</div></div>
        ))}
      </div>
      <div className="mt-5 f-progress-track">
        <div className="f-progress-fill" style={{ width: `${Math.round((race.weekCurrent / race.weekTotal) * 100)}%`, background: "linear-gradient(90deg,#2D4532,#5B8A64)" }} />
      </div>
      <div className="flex items-center justify-between mt-4">
        <span className="font-mono text-[10px] text-f-text2">{left} semanas para San Juan</span>
        <span className="font-sans font-bold uppercase text-f-green-light" style={{ fontSize: 13, letterSpacing: "0.18em" }}>FORJA</span>
      </div>
    </div>
  );
}

function Cards() {
  const { data } = useProfileData();
  const journeyCards = data.journeyCards;
  return (
    <>
      <div className="grid lg:grid-cols-2 gap-5">
        <div>
          <div className="f-datalabel mb-3">Último card · Semanal</div>
          <JourneyCardPreview />
          <div className="flex flex-wrap gap-2 mt-4">
            <button className="f-btn f-btn-primary f-btn-sm"><span className="material-symbols-outlined" style={{ fontSize: 17 }}>download</span> Descargar PNG</button>
            <button className="f-btn f-btn-secondary f-btn-sm"><span className="material-symbols-outlined" style={{ fontSize: 17 }}>share</span> Compartir</button>
            <button className="f-btn f-btn-secondary f-btn-sm"><span className="material-symbols-outlined" style={{ fontSize: 17 }}>tune</span> Personalizar</button>
            <Pill tone="green">Audi+</Pill>
          </div>
          <p className="text-[12px] text-f-text3 mt-3">Cada card que descargás lleva el logo FORJA. Vos posteás, Forja crece.</p>
        </div>

        <div>
          <div className="f-datalabel mb-3">Galería</div>
          <div className="f-card !p-0 divide-y divide-f-border">
            {journeyCards.map((c) => (
              <div key={c.id} className="px-5 py-3.5 flex items-center gap-3">
                <span className="material-symbols-outlined flex-none rounded-md flex items-center justify-center bg-f-surface text-f-green-light" style={{ width: 38, height: 38, fontSize: 19 }}>image</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-f-text truncate font-serif italic">{c.title}</div>
                  <div className="font-mono text-[10px] text-f-text3 mt-0.5">{c.kind} · Semana {c.week} · {c.date}</div>
                </div>
                <button className="f-btn-ghost"><span className="material-symbols-outlined" style={{ fontSize: 17 }}>download</span></button>
                <button className="f-btn-ghost"><span className="material-symbols-outlined" style={{ fontSize: 17 }}>share</span></button>
              </div>
            ))}
            <div className="px-5 py-3.5 flex items-center gap-3 opacity-60">
              <span className="material-symbols-outlined flex-none rounded-md flex items-center justify-center bg-f-surface text-f-text3" style={{ width: 38, height: 38, fontSize: 19 }}>lock</span>
              <div className="flex-1">
                <div className="text-[13px] text-f-text2 font-serif italic">Card de víspera de carrera</div>
                <div className="font-mono text-[10px] text-f-text3 mt-0.5">Se genera 1 día antes · 29 oct 2026</div>
              </div>
              <Pill tone="gold">Audi+</Pill>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------- 5.3 Performance Score ---------------- */
function Score() {
  const { data } = useProfileData();
  const { scoreStats, scoreSeries, athlete } = data;
  const labels = ["S1", "", "", "", "", "", "S7", "", "", "", "", "", "", "S14"];
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-4">
        {[
          { l: "Score actual", v: scoreStats.current, tone: scoreColor(scoreStats.current) },
          { l: "Promedio 7d", v: scoreStats.avg7, tone: "#5B8A64" },
          { l: "Promedio 30d", v: scoreStats.avg30, tone: "#5B8A64" },
          { l: "Promedio 90d", v: scoreStats.avg90, tone: "#C49A3C" },
        ].map((x) => (
          <div key={x.l} className="f-card">
            <div className="font-sans font-bold text-[24px] sm:text-[28px]" style={{ color: x.tone }}>{x.v}</div>
            <div className="f-datalabel mt-1">{x.l}</div>
          </div>
        ))}
      </div>

      <div className="f-card mb-4">
        <span className="f-datalabel">Evolución del score</span>
        <div className="mt-4">
          <LineChart height={180} labels={labels.filter(Boolean)} series={[{ data: scoreSeries, color: "#5B8A64" }]} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="f-card">
          <span className="f-datalabel">Desglose del score</span>
          <div className="mt-4 flex flex-col gap-4">
            {[
              { l: "Adherencia nutricional (kcal + macros)", v: 46, c: "#5B8A64" },
              { l: "Completitud de sesiones", v: 36, c: "#5B8A64" },
              { l: "Consistencia (streak de días)", v: 18, c: "#C9A24B" },
            ].map((x) => (
              <div key={x.l}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-[13px] text-f-text2">{x.l}</span>
                  <span className="font-mono text-[12px]" style={{ color: x.c }}>{x.v}%</span>
                </div>
                <div className="f-progress-track"><div className="f-progress-fill" style={{ width: `${x.v}%`, background: x.c }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="f-card flex flex-col justify-center items-center text-center">
          <Pill tone="gold">Audi+</Pill>
          <div className="font-sans font-bold text-f-gold mt-3" style={{ fontSize: 44 }}>Top {scoreStats.percentile}%</div>
          <div className="text-[14px] text-f-text mt-1">en la comunidad Forja esta semana</div>
          <p className="text-[12px] text-f-text3 mt-3 max-w-[44ch]">
            Competís contra la comunidad, no contra personas. {athlete.firstName}, estás en el cuartil de los que no aflojan.
          </p>
        </div>
      </div>
    </>
  );
}
