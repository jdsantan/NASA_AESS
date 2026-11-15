import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { CABIN_OXYGEN_REFERENCE } from "../data/astriaConfig.js";
const number = new Intl.NumberFormat("es", { maximumFractionDigits: 1 });
const tickTime = new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const detailTime = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" });
const chartMetrics = {
  radiation: { label: "Radiación", title: "Dosis personal acumulada", lines: [{ key: "radiation", name: "Dosis personal", unit: "mSv", color: "#2563eb" }] },
  sleep: { label: "Sueño", title: "Horas de sueño y estado de ánimo", lines: [{ key: "sleep", name: "Sueño", unit: "h", color: "#334155" }] },
  bone: { label: "Densidad ósea", title: "Densidad ósea estimada de ejemplo", lines: [{ key: "bone", name: "Densidad ósea", unit: "%", color: "#4f46e5" }] },
  cardio: { label: "Cardiovascular", title: "Pulso y presión arterial", lines: [
    { key: "heart", name: "Pulso", unit: "lpm", color: "#1d4ed8", dash: "6 4" },
    { key: "sys", name: "Presión sistólica", unit: "mmHg", color: "#9f1239" },
    { key: "dia", name: "Presión diastólica", unit: "mmHg", color: "#7e22ce", dash: "2 4" },
  ] },
  oxygen: { label: "Oxígeno de cabina (%)", title: "Oxígeno de cabina", lines: [{ key: "o2", name: "Oxígeno de cabina", unit: "%", color: "#0e7490" }] },
};

const moods = {
  estable: { name: "Estable", color: "#15803d" },
  fatiga: { name: "Fatiga", color: "#b45309" },
  estrés: { name: "Estrés", color: "#be123c" },
  bajo: { name: "Ánimo bajo", color: "#b45309" },
};
const unknownMood = { name: "Sin dato de ánimo", color: "#64748b" };

function moodFor(value) {
  const key = String(value ?? "").trim().toLocaleLowerCase("es");
  if (key === "estres" || key === "estresado") return moods["estrés"];
  if (key === "fatigado" || key === "cansado") return moods.fatiga;
  return moods[key] ?? unknownMood;
}

function SleepDot({ cx, cy, payload }) {
  if (cx == null || cy == null) return null;
  const result = moodFor(payload?.mood);
  return <circle cx={cx} cy={cy} r={4.5} fill={result.color} stroke="white" strokeWidth={1.5} />;
}

function ChartTooltip({ active, label, payload, metric }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-sm">
      <p className="mb-1 font-semibold text-slate-900">{detailTime.format(label)}</p>
      {payload.filter(({ value }) => Number.isFinite(value)).map(({ dataKey, name, value, unit }) => (
        <p key={dataKey} className="text-slate-700">{name}: {number.format(value)} {unit}</p>
      ))}
      {metric === "sleep" && <p className="mt-1 text-slate-700">Ánimo: {moodFor(payload[0].payload.mood).name}</p>}
    </div>
  );
}

export default function TrendChart({ history, metric, onMetric }) {
  const current = chartMetrics[metric] ?? chartMetrics.radiation;
  const keys = current.lines.map(({ key }) => key);
  const points = history
    .map((row) => ({ ...row, stamp: Date.parse(row.time) }))
    .filter((row) => Number.isFinite(row.stamp) && keys.some((key) => Number.isFinite(row[key])))
    .sort((a, b) => a.stamp - b.stamp);
  const visibleMoods = [...new Set(points.map(({ mood }) => moodFor(mood)))];

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div role="group" className="flex flex-wrap gap-1.5" aria-label="Indicador de la gráfica">
        {Object.entries(chartMetrics).map(([key, option]) => (
          <button
            key={key}
            type="button"
            onClick={() => onMetric(key)}
            aria-pressed={metric === key}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${metric === key ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{current.title}</h3>
      {points.length ? (
        <>
          <div role="img" aria-label={`Historial de ${current.title.toLowerCase()}`} className="mt-2 h-64 min-w-0 sm:h-80">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} debounce={50}>
              <LineChart data={points} margin={{ top: 15, right: 12, left: 4, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 5" vertical={false} />
                <XAxis
                  dataKey="stamp" type="number" domain={["dataMin", "dataMax"]}
                  tickFormatter={(value) => tickTime.format(value)}
                  tick={{ fill: "#475569", fontSize: 11 }}
                  axisLine={false} tickLine={false} minTickGap={30} tickCount={4}
                />
                <YAxis
                  width={40} yAxisId="main" unit={metric === "cardio" ? "" : current.lines[0].unit}
                  tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false}
                  domain={metric === "oxygen" ? [
                    (minimum) => Math.min(19, Math.floor(minimum)),
                    (maximum) => Math.max(22, Math.ceil(maximum)),
                  ] : ["auto", "auto"]}
                />
                {metric === "cardio" && (
                  <YAxis yAxisId="pulse" orientation="right" width={36}
                    tick={{ fill: "#1d4ed8", fontSize: 11 }} axisLine={false} tickLine={false} />
                )}
                <Tooltip content={<ChartTooltip metric={metric} />} />
                {metric === "oxygen" && (
                  <ReferenceLine yAxisId="main" y={CABIN_OXYGEN_REFERENCE} stroke="#b91c1c" strokeWidth={2} strokeDasharray="6 4" ifOverflow="extendDomain" />
                )}
                {current.lines.map(({ key, name, unit, color, dash }) => (
                  <Line
                    key={key} yAxisId={key === "heart" ? "pulse" : "main"}
                    dataKey={key} name={name} unit={unit} stroke={color} strokeWidth={2.2} strokeDasharray={dash}
                    dot={metric === "sleep" ? <SleepDot /> : { r: 2.5, fill: color }} isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          {metric === "cardio" && (
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-700" aria-label="Series cardiovasculares">
              {current.lines.map(({ key, name, unit, color, dash }) => (
                <li key={key} className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="w-4 border-t-2" style={{ borderColor: color, borderTopStyle: dash ? "dashed" : "solid" }} />
                  {name} ({unit}{key === "heart" ? ", eje derecho" : ", eje izquierdo"})
                </li>
              ))}
            </ul>
          )}
          {metric === "sleep" && (
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-700" aria-label="Leyenda de estado de ánimo">
              {visibleMoods.map(({ name, color }) => (
                <li key={name} className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} /> {name}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : <p className="mt-5 text-sm text-slate-600">Aún no hay lecturas para este indicador.</p>}
      {metric === "oxygen" && <p className="mt-3 flex items-center gap-2 text-xs text-slate-700"><span aria-hidden="true" className="w-5 border-t-2 border-dashed border-red-700" />19,5 % · referencia de demostración. Medición compartida de cabina.</p>}
    </section>
  );
}
