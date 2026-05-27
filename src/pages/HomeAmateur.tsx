import { useProfileData } from "../api/store";
import { waActions } from "../lib/whatsapp";
import { Callout, Pill, SectionHeader } from "../components/ui";

/**
 * Home del modo amateur: contesta la unica pregunta que le importa al
 * gym-goer casual — "¿cómo voy?" — con minima estetica de score y cero
 * percentiles. Tres bloques temporales (hoy / semana / mes) cruzados con
 * dos dimensiones (entrenamiento / nutricion).
 *
 * El bloque superior muestra la meta personal cuando existe. Mientras el
 * fetch real del goal no esta wireado, leemos del athlete + race como
 * proxies. Cuando el backend exponga /api/profile/:u/goal, sustituir.
 */
export function HomeAmateur() {
  const { data } = useProfileData();
  const { athlete, today, week, weekSummary } = data;

  const todayProtein = today.macros.protein.value;
  const todayProteinTarget = today.macros.protein.target;
  const todayKcal = today.macros.kcal.value;
  const todayKcalTarget = today.macros.kcal.target;

  // Approximacion semanal/mensual usando lo disponible en el mock.
  const weekSessions = weekSummary.sessionsDone;
  const weekSessionsTotal = weekSummary.sessionsPlanned;
  const weekNutritionPct = weekSummary.nutritionPct;
  const monthSessions = 12;     // placeholder — real vendra del backend
  const monthNutritionPct = 84; // idem

  // Meta personal placeholder. Cuando se conecte el goal real del backend,
  // reemplazar este bloque con el shape de ActiveGoal.
  const goalText =
    athlete.personalGoal ??
    "Ponete una meta personal desde WhatsApp diciendo \"meta: ...\"";

  return (
    <>
      <SectionHeader
        eyebrow="Cómo voy"
        title={
          <>
            Hola, <span className="font-serif italic">{athlete.firstName}</span>.
          </>
        }
        lede="Tu progreso, sin ruido. Hoy, esta semana, este mes — entrenamiento y nutrición."
      />

      {/* Meta personal */}
      <div className="f-card mb-3 sm:mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="f-datalabel">Tu meta</div>
            <div className="font-serif italic text-[18px] text-f-text mt-1 truncate">
              {goalText}
            </div>
          </div>
          <Pill tone="green">En camino</Pill>
        </div>
      </div>

      {/* Bloques hoy / semana / mes */}
      <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
        <ProgressBlock
          title="Hoy"
          training={today.session.status === "done" ? "1 sesión hecha" : "Pendiente"}
          nutritionMain={`${todayKcal} / ${todayKcalTarget} kcal`}
          nutritionSecondary={`${todayProtein}g proteína / ${todayProteinTarget}g`}
          nutritionPct={Math.round((todayKcal / todayKcalTarget) * 100)}
        />
        <ProgressBlock
          title="Esta semana"
          training={`${weekSessions} de ${weekSessionsTotal} sesiones`}
          nutritionMain={`${weekNutritionPct}% adherencia`}
          nutritionSecondary={
            week
              .filter((d) => d.state === "done")
              .map((d) => d.day)
              .join(" · ") || "—"
          }
          nutritionPct={weekNutritionPct}
        />
        <ProgressBlock
          title="Este mes"
          training={`${monthSessions} sesiones`}
          nutritionMain={`${monthNutritionPct}% adherencia`}
          nutritionSecondary="Promedio últimos 30 días"
          nutritionPct={monthNutritionPct}
        />
      </div>

      {/* Acciones rapidas WhatsApp */}
      <div className="f-card mt-3 sm:mt-4">
        <span className="f-datalabel">Acciones rápidas</span>
        <p className="text-[13px] text-f-text2 mt-2 mb-3">
          Forja no te pide cargar formularios. Decile al bot lo que comiste
          o entrenaste y lo registra.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <a
            href={waActions.logMeal}
            target="_blank"
            rel="noreferrer"
            className="f-btn f-btn-wa flex-1"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              restaurant
            </span>
            Comí…
          </a>
          <a
            href={waActions.reportSession}
            target="_blank"
            rel="noreferrer"
            className="f-btn f-btn-secondary flex-1"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              fitness_center
            </span>
            Entrené…
          </a>
        </div>
      </div>

      <div className="mt-3 sm:mt-4">
        <Callout>
          A la noche Forja revisa el día y te manda un resumen — con tu meta como brújula.
        </Callout>
      </div>
    </>
  );
}

function ProgressBlock({
  title,
  training,
  nutritionMain,
  nutritionSecondary,
  nutritionPct,
}: {
  title: string;
  training: string;
  nutritionMain: string;
  nutritionSecondary: string;
  nutritionPct: number;
}) {
  const clamped = Math.min(100, Math.max(0, nutritionPct));
  return (
    <div className="f-card">
      <div className="f-datalabel">{title}</div>
      <div className="mt-3">
        <div className="flex items-center gap-2 text-[12px] text-f-text2 mb-1">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            fitness_center
          </span>
          Entrenamiento
        </div>
        <div className="text-[15px] text-f-text">{training}</div>
      </div>
      <div className="mt-4">
        <div className="flex items-center gap-2 text-[12px] text-f-text2 mb-1">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            restaurant
          </span>
          Nutrición
        </div>
        <div className="text-[15px] text-f-text">{nutritionMain}</div>
        <div className="text-[12px] text-f-text3 mt-0.5">{nutritionSecondary}</div>
        <div className="f-progress-track mt-2">
          <div
            className="f-progress-fill"
            style={{
              width: `${clamped}%`,
              background: "linear-gradient(90deg,#2D4532,#5B8A64)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
