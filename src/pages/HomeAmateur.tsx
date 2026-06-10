import { useProfileData } from "../api/store";
import { waActions } from "../lib/whatsapp";
import { Callout, Pill, SectionHeader } from "../components/ui";

/**
 * Home del modo amateur. Contesta "¿cómo voy?" con las dos señales que importan
 * para una meta de peso: la TENDENCIA de peso (no un punto) y la CONSISTENCIA
 * del hábito (rachas). La adherencia calórica queda en segundo plano — el
 * target estimado trabaja de fondo, pero no es lo que medimos acá.
 *
 * Todo viene del backend (overview):
 *   - weightProgress: weight_logs (serie + delta vs arranque + meta).
 *   - habit: días seguidos con registro + comidas/semana + sesiones/semana.
 *   - hoy/semana/mes: v_daily_remaining + daily_summaries (adherencia, muted).
 */
export function HomeAmateur() {
  const { data, source } = useProfileData();
  const { athlete, today, weekSummary, monthly, weightProgress: wp, habit, targetSource } = data;
  const isEstimatedTarget = targetSource === "forja_auto";

  const goalText =
    athlete.personalGoal ??
    'Ponete una meta desde WhatsApp diciendo "meta: bajar 5 kg"';
  const hasGoal = !!athlete.personalGoal;

  const hasWeight = wp.current != null && wp.count > 0;
  const lostOrGained = wp.deltaFromStart; // negativo = bajó
  const toward =
    wp.goalKind === "lose_weight" ? Math.max(0, -lostOrGained)
    : wp.goalKind === "gain_muscle" ? Math.max(0, lostOrGained)
    : 0;
  const goalPct =
    wp.goalKg && wp.goalKg > 0 ? Math.min(100, Math.round((toward / wp.goalKg) * 100)) : null;
  const remaining =
    wp.goalKg != null ? Math.max(0, Math.round((wp.goalKg - toward) * 10) / 10) : null;
  const deltaLabel = (() => {
    if (!hasWeight || wp.count <= 1) return "Tu punto de partida";
    const abs = Math.abs(lostOrGained).toFixed(1).replace(/\.0$/, "");
    if (lostOrGained < 0) return `−${abs} kg desde que arrancaste`;
    if (lostOrGained > 0) return `+${abs} kg desde que arrancaste`;
    return "Igual que el arranque";
  })();

  const todayKcal = today.macros.kcal.value;
  const todayKcalTarget = today.macros.kcal.target;

  return (
    <>
      <SectionHeader
        eyebrow="Como voy"
        title={
          <>
            Hola, <span className="font-serif italic">{athlete.firstName}</span>.
          </>
        }
        lede="Lo que importa: cómo viene tu peso y qué tan seguido aparecés. Sin obsesión por el número diario."
      />

      {/* ───────── Meta + tendencia de peso (la señal principal) ───────── */}
      <div className="f-card mb-3 sm:mb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="f-datalabel">Tu meta</div>
            <div className="font-serif italic text-[18px] text-f-text mt-1">{goalText}</div>
          </div>
          {hasGoal && hasWeight && <Pill tone="green">En camino</Pill>}
        </div>

        {hasWeight ? (
          <div className="mt-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <span className="font-mono text-[34px] leading-none text-f-text">{wp.current}</span>
                <span className="font-mono text-[13px] text-f-text2 ml-1">kg</span>
              </div>
              <div className="text-right">
                <div className={`text-[14px] ${lostOrGained < 0 ? "text-f-green-light" : "text-f-text2"}`}>
                  {deltaLabel}
                </div>
                {wp.start != null && (
                  <div className="font-mono text-[11px] text-f-text3 mt-0.5">arrancaste en {wp.start} kg</div>
                )}
              </div>
            </div>

            {wp.series.length >= 2 && (
              <div className="mt-3">
                <Sparkline points={wp.series.map((s) => s.kg)} />
              </div>
            )}

            {goalPct != null && remaining != null && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-[12px] text-f-text2 mb-1">
                  <span>Progreso hacia tu meta</span>
                  <span className="font-mono">
                    {remaining > 0 ? `te faltan ${remaining} kg` : "¡meta cumplida! 🎯"}
                  </span>
                </div>
                <div className="f-progress-track">
                  <div
                    className="f-progress-fill"
                    style={{ width: `${goalPct}%`, background: "linear-gradient(90deg,#2D4532,#5B8A64)" }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-f-border2 bg-f-surface p-3">
            <p className="text-[13px] text-f-text2">
              Todavía no registraste tu peso. Es la señal principal de tu progreso —
              mandámelo por WhatsApp y a partir de ahí medimos la tendencia.
            </p>
            <a href={waActions.logWeight} target="_blank" rel="noreferrer" className="f-btn f-btn-wa mt-3 inline-flex">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>monitor_weight</span>
              Cargar mi peso
            </a>
          </div>
        )}
      </div>

      {/* ───────── Racha de hábito ───────── */}
      <div className="f-card mb-3 sm:mb-4">
        <div className="f-datalabel">Tu constancia</div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <Stat
            icon="local_fire_department"
            value={habit.dayStreak}
            label={habit.dayStreak === 1 ? "día seguido" : "días seguidos"}
            hot={habit.dayStreak >= 3}
          />
          <Stat icon="restaurant" value={habit.mealsThisWeek} label="comidas / semana" />
          <Stat icon="fitness_center" value={habit.sessionsThisWeek} label="entrenos / semana" />
        </div>
        {habit.dayStreak === 0 && (
          <p className="text-[12px] text-f-text3 mt-3">
            Registrá una comida hoy y arrancás la racha. Lo que cuenta es aparecer, no la perfección.
          </p>
        )}
      </div>

      {/* ───────── Semana / mes (training-led; adherencia muted) ───────── */}
      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
        <CompactBlock
          title="Esta semana"
          main={
            weekSummary.sessionsPlanned > 0
              ? `${weekSummary.sessionsDone} de ${weekSummary.sessionsPlanned} sesiones`
              : `${weekSummary.sessionsDone} sesiones`
          }
          muted={weekSummary.nutritionPct > 0 ? `nutrición ${weekSummary.nutritionPct}% del estimado` : undefined}
        />
        <CompactBlock
          title="Este mes"
          main={`${monthly.sessionsDone} sesiones`}
          muted={monthly.nutritionPct != null ? `nutrición ${monthly.nutritionPct}% del estimado` : undefined}
        />
      </div>

      {/* Hoy (kcal, en chico; "estimado" solo si el target lo calculó Forja) */}
      {todayKcalTarget > 0 && (
        <div className="f-card mt-3 sm:mt-4 flex items-center justify-between gap-3">
          <span className="f-datalabel">Hoy</span>
          <span className="font-mono text-[13px] text-f-text2">
            {todayKcal} / {todayKcalTarget} kcal
            {isEstimatedTarget && <span className="text-f-text3"> (estimado)</span>}
          </span>
        </div>
      )}

      {/* Acciones rápidas WhatsApp */}
      <div className="f-card mt-3 sm:mt-4">
        <span className="f-datalabel">Acciones rápidas</span>
        <p className="text-[13px] text-f-text2 mt-2 mb-3">
          Forja no te pide cargar formularios. Decile al bot lo que comiste,
          entrenaste o cuánto pesás y lo registra.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <a href={waActions.logMeal} target="_blank" rel="noreferrer" className="f-btn f-btn-wa flex-1">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>restaurant</span>
            Comí…
          </a>
          <a href={waActions.logWeight} target="_blank" rel="noreferrer" className="f-btn f-btn-secondary flex-1">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>monitor_weight</span>
            Peso…
          </a>
          <a href={waActions.reportSession} target="_blank" rel="noreferrer" className="f-btn f-btn-secondary flex-1">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>fitness_center</span>
            Entrené…
          </a>
        </div>
      </div>

      <div className="mt-3 sm:mt-4">
        <Callout>
          {source === "live"
            ? "A la noche Forja revisa el día y te manda un resumen — con tu meta como brújula."
            : "No pudimos cargar tus datos ahora. Reintentá en unos minutos."}
        </Callout>
      </div>
    </>
  );
}

function Stat({
  icon,
  value,
  label,
  hot,
}: {
  icon: string;
  value: number;
  label: string;
  hot?: boolean;
}) {
  return (
    <div className="text-center">
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 20, color: hot ? "#C49A3C" : "#5B8A64" }}
      >
        {icon}
      </span>
      <div className="font-mono text-[22px] text-f-text leading-tight">{value}</div>
      <div className="text-[11px] text-f-text3">{label}</div>
    </div>
  );
}

function CompactBlock({ title, main, muted }: { title: string; main: string; muted?: string }) {
  return (
    <div className="f-card">
      <div className="f-datalabel">{title}</div>
      <div className="text-[16px] text-f-text mt-2">{main}</div>
      {muted && <div className="text-[12px] text-f-text3 mt-1">{muted}</div>}
    </div>
  );
}

/** Sparkline minimal de la serie de peso. Verde, último punto marcado. */
function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const W = 240;
  const H = 44;
  const pad = 4;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = (W - pad * 2) / (points.length - 1);
  const coords = points.map((v, i) => {
    const x = pad + i * step;
    const y = pad + (1 - (v - min) / range) * (H - pad * 2);
    return [x, y] as const;
  });
  const path = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const [lx, ly] = coords[coords.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }} preserveAspectRatio="none">
      <path d={path} fill="none" stroke="#5B8A64" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r={3.5} fill="#2D4532" />
    </svg>
  );
}
