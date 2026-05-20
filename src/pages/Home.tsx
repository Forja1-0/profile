import { useState } from "react";
import { useProfileData } from "../api/store";
import { waActions } from "../lib/whatsapp";
import { ScoreRing, MacroBar, WeekGrid, scoreColor } from "../components/charts";
import { Pill, SectionHeader, Callout } from "../components/ui";

const SESSION_ICON: Record<string, string> = { gym: "fitness_center", swim: "pool", bike: "pedal_bike", run: "directions_run", rest: "bedtime" };
const hour = 19; // simulación: son las 19:00 → alerta suave si falta >30%

export function Home() {
  const { data } = useProfileData();
  const { athlete, race, today, week, weekSummary, streaks } = data;
  const [showBreakdown, setShowBreakdown] = useState(false);
  const racePct = Math.round((race.weekCurrent / race.weekTotal) * 100);
  const m = today.macros;
  const kcalAlert = hour >= 18 && m.kcal.value / m.kcal.target < 0.7;

  return (
    <>
      <SectionHeader
        eyebrow={`Viernes 16 may · Semana ${race.weekCurrent}`}
        title={<>Buen día, <span className="font-serif italic">{athlete.firstName}</span>.</>}
        lede="Esto es lo que falta hoy. No te dice qué hacer — te recuerda que estás en camino."
      />

      <div className="grid lg:grid-cols-3 gap-3 sm:gap-4">
        {/* HERO — Score + macros */}
        <div className="lg:col-span-2 f-card">
          {/* Mobile: ring centrado arriba + macros debajo; sm+: lado a lado */}
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-center sm:items-start">
            <button onClick={() => setShowBreakdown((v) => !v)} className="flex-none" aria-label="Ver desglose del score">
              {/* En mobile el ring se reduce: dejaba poco aire para los macros. */}
              <span className="hidden sm:inline-flex"><ScoreRing value={today.score} label="Score hoy" /></span>
              <span className="inline-flex sm:hidden"><ScoreRing value={today.score} label="Score hoy" size={132} stroke={10} /></span>
            </button>
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-[13px] text-f-text2">Macros de hoy</span>
                {kcalAlert ? <Pill tone="warn">Vas corta</Pill> : <Pill tone="green">En camino</Pill>}
              </div>
              <div className="flex flex-col gap-3.5">
                <MacroBar label="Kcal" value={m.kcal.value} target={m.kcal.target} unit="kcal" alert={kcalAlert} />
                <MacroBar label="Proteína" value={m.protein.value} target={m.protein.target} unit="g" />
                <MacroBar label="Carbohidratos" value={m.carbs.value} target={m.carbs.target} unit="g" />
                <MacroBar label="Grasa" value={m.fat.value} target={m.fat.target} unit="g" />
              </div>
            </div>
          </div>

          {showBreakdown && (
            <div className="mt-5 pt-5 border-t border-f-border f-fade-up">
              <div className="f-datalabel mb-3">Desglose del Performance Score · {today.score}/100</div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { l: "Nutrición", v: today.scoreBreakdown.nutrition, c: "#5B8A64" },
                  { l: "Entrenamiento", v: today.scoreBreakdown.training, c: "#5B8A64" },
                  { l: "Consistencia", v: today.scoreBreakdown.consistency, c: "#C9A24B" },
                ].map((x) => (
                  <div key={x.l} className="bg-f-surface rounded-lg p-3 border border-f-border">
                    <div className="font-sans font-bold text-[19px] sm:text-[20px]" style={{ color: x.c }}>{x.v}<span className="text-f-text3 text-[12px] sm:text-[13px]">pts</span></div>
                    <div className="f-datalabel mt-1">{x.l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[11px] text-f-text3 mt-4 sm:hidden">Tocá el ring para ver el desglose.</p>
        </div>

        {/* Sesión del día + acciones */}
        <div className="f-card flex flex-col">
          <span className="f-datalabel">Sesión de hoy</span>
          <div className="flex items-center gap-3 mt-3">
            <span className="material-symbols-outlined flex-none rounded-lg flex items-center justify-center bg-f-green-dim text-f-green-glow" style={{ width: 44, height: 44, fontSize: 22 }}>
              {SESSION_ICON[today.session.type]}
            </span>
            <div className="min-w-0">
              <div className="text-[15px] font-medium text-f-text leading-tight">{today.session.title}</div>
              <div className="font-mono text-[11px] text-f-text2 mt-1">{today.session.time} · Pendiente</div>
            </div>
          </div>
          <div className="mt-4 sm:mt-auto pt-4 sm:pt-5 flex flex-col gap-2">
            <a href={waActions.logMeal} target="_blank" rel="noreferrer" className="f-btn f-btn-wa w-full">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>restaurant</span> Loguear comida
            </a>
            <a href={waActions.reportSession} target="_blank" rel="noreferrer" className="f-btn f-btn-secondary w-full">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>task_alt</span> Reportar sesión
            </a>
          </div>
        </div>
      </div>

      {/* Countdown + semana en una sola card en mobile (menos cards apilados) */}
      <div className="f-card mt-3 sm:mt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="min-w-0 pr-3">
            <div className="f-datalabel">Carrera objetivo</div>
            <div className="text-[15px] sm:text-[16px] font-bold text-f-text mt-1 truncate">{race.name}</div>
          </div>
          <div className="text-right flex-none">
            <div className="font-sans font-bold text-[22px] text-f-green-glow leading-none">{race.weekTotal - race.weekCurrent}</div>
            <div className="f-datalabel mt-1">semanas</div>
          </div>
        </div>
        <div className="f-progress-track">
          <div className="f-progress-fill" style={{ width: `${racePct}%`, background: "linear-gradient(90deg,#2D4532,#5B8A64)" }} />
        </div>
        <div className="flex justify-between mt-2 font-mono text-[10px] text-f-text3">
          <span>Sem {race.weekCurrent} de {race.weekTotal}</span>
          <span>30 oct 2026 · {racePct}%</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
        <div className="f-card">
          <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
            <span className="f-datalabel">Tu semana</span>
            <span className="font-mono text-[10px] sm:text-[11px] text-f-text2 text-right">
              {weekSummary.sessionsDone}/{weekSummary.sessionsPlanned} ses · {weekSummary.nutritionPct}% nutr
            </span>
          </div>
          <WeekGrid days={week} />
        </div>

        <div className="f-card">
          <span className="f-datalabel">Rachas e hitos recientes</span>
          <div className="mt-3 flex flex-col gap-2">
            {streaks.map((s, i) => (
              <div key={i} className="flex items-center gap-3 bg-f-surface rounded-lg px-3.5 py-2.5 border border-f-border">
                <span className="material-symbols-outlined flex-none" style={{ fontSize: 18, color: s.tone === "gold" ? "#C9A24B" : "#5B8A64" }}>{s.icon}</span>
                <span className="text-[13px] text-f-text">{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 sm:mt-4">
        <Callout>
          {race.weekTotal - race.weekCurrent} semanas para San Juan. Cada día que cerrás es uno que nadie te puede sacar — ni vos.
        </Callout>
      </div>

      <div className="mt-4 hidden lg:flex">
        <span className="material-symbols-outlined mr-1.5" style={{ fontSize: 14, color: scoreColor(today.score) }}>circle</span>
        <span className="text-[12px] text-f-text3">Tocá el score para ver de dónde sale cada punto.</span>
      </div>
    </>
  );
}
