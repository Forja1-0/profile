/** Charts SVG hechos a mano — sin librerías, colores del design system Forja. */

export function scoreColor(v: number): string {
  if (v >= 90) return "#C9A24B"; // dorado
  if (v >= 75) return "#5B8A64"; // verde
  if (v >= 50) return "#C49A3C"; // ámbar
  return "#A8404D"; // rojo
}

/* Performance Score ring */
export function ScoreRing({ value, size = 168, stroke = 12, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);
  const col = scoreColor(value);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#1C1C20" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke={col} strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset .7s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-sans font-bold leading-none" style={{ fontSize: size * 0.33, color: col }}>{value}</span>
        <span className="f-datalabel mt-1">{label ?? "Score"}</span>
      </div>
    </div>
  );
}

/* Macro progress bar */
export function MacroBar({
  label, value, target, unit, alert,
}: { label: string; value: number; target: number; unit: string; alert?: boolean }) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  const col = alert ? "#C49A3C" : pct >= 95 ? "#5B8A64" : "#5B8A64";
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[13px] text-f-text2">{label}</span>
        <span className="f-metric">
          <span style={{ color: alert ? "#C49A3C" : "#D4CFC4" }}>{value}</span>
          <span className="text-f-text3"> / {target} {unit}</span>
          <span className="text-f-text3"> · {pct}%</span>
        </span>
      </div>
      <div className="f-progress-track">
        <div className="f-progress-fill" style={{ width: `${pct}%`, background: col }} />
      </div>
    </div>
  );
}

/* Línea de barra simple etiquetada */
export function LabeledBar({ label, pct, color = "#5B8A64", right }: { label: string; pct: number; color?: string; right?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[13px] text-f-text2">{label}</span>
        {right && <span className="f-metric">{right}</span>}
      </div>
      <div className="f-progress-track">
        <div className="f-progress-fill" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
      </div>
    </div>
  );
}

/* Line chart (una o dos series) */
export function LineChart({
  series, height = 160, labels,
}: {
  series: { data: number[]; color: string; dashed?: boolean }[];
  height?: number;
  labels?: string[];
}) {
  const w = 600;
  const pad = 8;
  const all = series.flatMap((s) => s.data);
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const n = series[0].data.length;
  const x = (i: number) => pad + (i * (w - pad * 2)) / (n - 1);
  const y = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2);

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={0} x2={w} y1={pad + g * (height - pad * 2)} y2={pad + g * (height - pad * 2)} stroke="rgba(255,255,255,0.045)" />
        ))}
        {series.map((s, si) => (
          <polyline
            key={si}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeDasharray={s.dashed ? "5 5" : undefined}
            strokeLinejoin="round"
            strokeLinecap="round"
            points={s.data.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
          />
        ))}
        {series[0].data.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r={2.4} fill={series[0].color} />
        ))}
      </svg>
      {labels && (
        <div className="flex justify-between mt-2 font-mono text-[9px] text-f-text3">
          {labels.map((l, i) => <span key={i}>{l}</span>)}
        </div>
      )}
    </div>
  );
}

/* Bar chart (adherencia semanal, etc.) */
export function BarChart({ data, height = 140, target }: { data: { label: string; v: number }[]; height?: number; target?: number }) {
  const max = Math.max(...data.map((d) => d.v), target ?? 0) || 1;
  return (
    <div>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => {
          const h = (d.v / max) * (height - 22);
          const col = d.v >= 90 ? "#5B8A64" : d.v >= 70 ? "#C49A3C" : "#A8404D";
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1.5">
              <span className="font-mono text-[9px] text-f-text2">{d.v}</span>
              <div className="w-full rounded-t" style={{ height: Math.max(4, h), background: col }} />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mt-2">
        {data.map((d, i) => <span key={i} className="flex-1 text-center font-mono text-[9px] text-f-text3">{d.label}</span>)}
      </div>
    </div>
  );
}

/* Weight evolution sparkline-ish */
export function AreaChart({ data, color = "#5B8A64", height = 130 }: { data: number[]; color?: string; height?: number }) {
  const w = 600, pad = 6;
  const min = Math.min(...data), max = Math.max(...data);
  const span = max - min || 1;
  const x = (i: number) => pad + (i * (w - pad * 2)) / (data.length - 1);
  const y = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2);
  const line = data.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const area = `${pad},${height} ${line} ${w - pad},${height}`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
      <defs>
        <linearGradient id="ac" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#ac)" />
      <polyline points={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {data.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={2.4} fill={color} />)}
    </svg>
  );
}

/* Mini grilla de la semana (7 días con estado) */
const STATE_META: Record<string, { icon: string; color: string; bg: string }> = {
  done: { icon: "check", color: "#abd0af", bg: "rgba(58,90,64,0.22)" },
  skipped: { icon: "close", color: "#A8404D", bg: "rgba(122,40,50,0.18)" },
  rest: { icon: "bedtime", color: "#8A8680", bg: "#1C1C20" },
  today: { icon: "radio_button_checked", color: "#C9A24B", bg: "rgba(201,162,75,0.16)" },
  future: { icon: "", color: "#524F4A", bg: "#141416" },
};

export function WeekGrid({ days }: { days: { day: string; state: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((d) => {
        const m = STATE_META[d.state] ?? STATE_META.future;
        return (
          <div key={d.day} className="text-center" title={d.label}>
            <div className="f-datalabel mb-1.5">{d.day}</div>
            <div
              className="mx-auto rounded-lg flex items-center justify-center"
              style={{ width: 38, height: 38, background: m.bg, border: d.state === "today" ? "1px solid #C9A24B" : "1px solid rgba(255,255,255,0.05)" }}
            >
              {m.icon && <span className="material-symbols-outlined" style={{ fontSize: 18, color: m.color }}>{m.icon}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
