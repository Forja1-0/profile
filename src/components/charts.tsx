/** Charts powered by Recharts — minimal dark-theme matching Forja design system. */
import {
  ResponsiveContainer,
  LineChart as RLineChart,
  BarChart as RBarChart,
  AreaChart as RAreaChart,
  Line, Bar, Area,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  Cell,
} from "recharts";

export function scoreColor(v: number): string {
  if (v >= 90) return "#C9A24B";
  if (v >= 75) return "#5B8A64";
  if (v >= 50) return "#C49A3C";
  return "#A8404D";
}

const TOOLTIP_STYLE: React.CSSProperties = {
  background: "#1A1A1E",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  fontSize: 10,
  fontFamily: "Space Mono, monospace",
  color: "#D4CFC4",
  padding: "4px 10px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
};
const AXIS_TICK = { fontSize: 9, fill: "#6B6762", fontFamily: "Space Mono, monospace" };
const GRID_STROKE = "rgba(255,255,255,0.045)";

/* Performance Score ring — SVG (no recharts equivalent) */
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

/* Macro progress bar — keep custom */
export function MacroBar({
  label, value, target, unit, alert,
}: { label: string; value: number; target: number; unit: string; alert?: boolean }) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  const col = alert ? "#C49A3C" : "#5B8A64";
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

/* Línea de barra simple etiquetada — keep custom */
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

/* Line chart — Recharts */
export function LineChart({
  series, height = 160, labels,
}: {
  series: { data: number[]; color: string; dashed?: boolean; name?: string }[];
  height?: number;
  labels?: string[];
}) {
  const n = series[0]?.data.length ?? 0;
  if (n === 0) return null;

  const data = Array.from({ length: n }, (_, i) => {
    const pt: Record<string, number> = { i };
    series.forEach((s, si) => { pt[`v${si}`] = s.data[i]; });
    return pt;
  });

  // Map index positions to label strings (first, middle, last)
  const labelMap = new Map<number, string>();
  if (labels?.length) {
    if (labels[0]) labelMap.set(0, labels[0]);
    if (labels[1] && n > 2) labelMap.set(Math.floor((n - 1) / 2), labels[1]);
    if (labels[labels.length - 1] && n > 1) labelMap.set(n - 1, labels[labels.length - 1]);
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RLineChart data={data} margin={{ top: 6, right: 4, bottom: labels ? 4 : 4, left: -24 }}>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis
          dataKey="i"
          type="number"
          domain={[0, n - 1]}
          ticks={labelMap.size ? [...labelMap.keys()] : []}
          tickFormatter={(i: number) => labelMap.get(i) ?? ""}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          interval={0}
        />
        <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={30} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelFormatter={(i) => labelMap.get(Number(i)) ?? `${i}`}
          cursor={{ stroke: "rgba(255,255,255,0.06)", strokeWidth: 1 }}
        />
        {series.map((s, si) => (
          <Line
            key={si}
            dataKey={`v${si}`}
            name={s.name ?? `Serie ${si + 1}`}
            stroke={s.color}
            strokeWidth={2}
            strokeDasharray={s.dashed ? "5 5" : undefined}
            dot={si === 0 ? { r: 2.5, fill: s.color, strokeWidth: 0 } : false}
            activeDot={{ r: 4, fill: s.color, strokeWidth: 0 }}
          />
        ))}
      </RLineChart>
    </ResponsiveContainer>
  );
}

/* Bar chart — Recharts */
export function BarChart({ data, height = 140 }: { data: { label: string; v: number }[]; height?: number; target?: number }) {
  if (data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RBarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -28 }} barCategoryGap="30%">
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} domain={[0, 100]} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Bar dataKey="v" name="Adherencia" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.v >= 90 ? "#5B8A64" : d.v >= 70 ? "#C49A3C" : "#A8404D"} />
          ))}
        </Bar>
      </RBarChart>
    </ResponsiveContainer>
  );
}

/* Area chart — Recharts */
export function AreaChart({ data, color = "#5B8A64", height = 130 }: { data: number[]; color?: string; height?: number }) {
  if (data.length < 2) return null;
  const chartData = data.map((v, i) => ({ i, v }));
  const gradId = `ag${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RAreaChart data={chartData} margin={{ top: 6, right: 4, bottom: 0, left: -28 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="i" hide />
        <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={30} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "rgba(255,255,255,0.06)" }} />
        <Area
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradId})`}
          dot={{ r: 2.5, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
        />
      </RAreaChart>
    </ResponsiveContainer>
  );
}

/* Mini grilla de la semana — keep custom SVG */
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
