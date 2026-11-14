import { useId } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const ASTRIA_TRENDS = {
  radiation: { label: "Radiación", unit: "mSv", color: "#c084fc", fullLabel: "Radiación acumulada" },
  sleep: { label: "Sueño", unit: "h", color: "#22d3ee", fullLabel: "Horas de sueño" },
  bone: { label: "Densidad ósea", unit: "%", color: "#fbbf24", fullLabel: "Densidad ósea simulada" },
};

export default function TrendChart({ history, metric, onMetric }) {
  const gradientId = useId();
  const current = ASTRIA_TRENDS[metric] ?? ASTRIA_TRENDS.sleep;
  const number = new Intl.NumberFormat("es", { maximumFractionDigits: 1 });

  return (
    <section className="min-w-0 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-slate-100">Tendencias</h2>
        <span className="text-xs text-slate-400">Últimos 7 días</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Indicador de la gráfica">
        {Object.entries(ASTRIA_TRENDS).map(([key, option]) => (
          <button
            key={key}
            type="button"
            onClick={() => onMetric(key)}
            aria-pressed={metric === key}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${metric === key ? "border-cyan-700 bg-cyan-950 text-cyan-100" : "border-slate-800 text-slate-300 hover:border-slate-600"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="mb-2 mt-3 text-xs text-slate-400">{current.fullLabel} ({current.unit})</p>
      <div
        role="img"
        aria-label={`${current.fullLabel}, últimos 7 días. ${history.map((entry) => `${entry.day}, ${(entry[metric] === null ? "sin datos" : number.format(entry[metric]))}${entry[metric] === null ? "" : " " + current.unit}`).join("; ")}`}
        className="h-40 min-w-0"
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} debounce={50}>
          <AreaChart data={history} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={current.color} stopOpacity=".35" />
                <stop offset="100%" stopColor={current.color} stopOpacity=".02" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#233047" strokeDasharray="3 5" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={10} />
            <YAxis
              width={36}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => number.format(value)}
              domain={metric === "bone" ? ["auto", "auto"] : [0, "auto"]}
            />
            <Tooltip
              formatter={(value) => [`${number.format(value)} ${current.unit}`, current.fullLabel]}
              contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 10, fontSize: 12 }}
              labelStyle={{ color: "#e2e8f0" }}
              itemStyle={{ color: current.color }}
            />
            <Area dataKey={metric} type="monotone" stroke={current.color} strokeWidth={2} fill={`url(#${gradientId})`} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
