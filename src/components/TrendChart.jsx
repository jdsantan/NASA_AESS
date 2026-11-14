import React from "react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const ASTRIA_TRENDS = {
  radiation: { label: "Radiación", unit: "mSv", color: "#2563eb", fullLabel: "Radiación acumulada" },
  sleep: { label: "Sueño", unit: "h", color: "#0284c7", fullLabel: "Horas de sueño" },
  bone: { label: "Densidad ósea", unit: "%", color: "#4f46e5", fullLabel: "Densidad ósea simulada" },
};

export default function TrendChart({ history, metric, onMetric }) {
  const gradientId = React.useId();
  const current = ASTRIA_TRENDS[metric] ?? ASTRIA_TRENDS.sleep;
  const number = new Intl.NumberFormat("es", { maximumFractionDigits: 1 });

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-slate-900">Evolución del indicador</h2>
        <span className="text-xs font-medium text-slate-500">Últimos 7 días</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Indicador de la gráfica">
        {Object.entries(ASTRIA_TRENDS).map(([key, option]) => (
          <button
            key={key}
            type="button"
            onClick={() => onMetric(key)}
            aria-pressed={metric === key}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${metric === key ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="mb-2 mt-3 text-xs font-medium text-slate-500">{current.fullLabel} ({current.unit})</p>
      <div role="img" aria-label={`${current.fullLabel}, últimos 7 días.`} className="h-64 min-w-0 sm:h-80">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} debounce={50}>
          <AreaChart data={history} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={current.color} stopOpacity=".28" />
                <stop offset="100%" stopColor={current.color} stopOpacity=".02" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 5" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={10} />
            <YAxis
              width={36}
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => number.format(value)}
              domain={metric === "bone" ? ["auto", "auto"] : [0, "auto"]}
            />
            <Tooltip
              formatter={(value) => [`${number.format(value)} ${current.unit}`, current.fullLabel]}
              contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: 12 }}
              labelStyle={{ color: "#0f172a", fontWeight: 600 }}
              itemStyle={{ color: current.color }}
            />
            <Area dataKey={metric} type="monotone" stroke={current.color} strokeWidth={2.2} fill={`url(#${gradientId})`} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}