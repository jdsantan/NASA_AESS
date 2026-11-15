import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { CABIN_OXYGEN_REFERENCE, PANEL } from "../data/astriaConfig.js";
const MONO_FONT_STACK = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const number = new Intl.NumberFormat("es", { maximumFractionDigits: 2 });
const VISIBLE_POINT_COUNT = 15;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const Y_AXIS_WIDTH = 76;
const dayTickFormatter = new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const clockTickFormatter = new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const Y_AXIS_RULES = {
  radiation: { fractionDigits: 2, minimumPadding: 0.5, lowerBound: 0 },
  sleep: { fractionDigits: 1, minimumPadding: 1, lowerBound: 0 },
  bone: { fractionDigits: 1, minimumPadding: 1 },
  cardio: { fractionDigits: 0, minimumPadding: 10, lowerBound: 0 },
  oxygen: { fractionDigits: 1, fixedRange: [17, 23] },
};

function buildYAxisDomain({ minimumPadding = 0, lowerBound = -Infinity, fixedRange }) {
  if (fixedRange) {
    const [rangeMinimum, rangeMaximum] = fixedRange;
    return [
      (dataMinimum) => Math.min(rangeMinimum, Math.floor(dataMinimum)),
      (dataMaximum) => Math.max(rangeMaximum, Math.ceil(dataMaximum)),
    ];
  }
  return [
    (dataMinimum) => Math.max(lowerBound, Math.floor((dataMinimum - minimumPadding) * 10) / 10),
    (dataMaximum) => Math.ceil((dataMaximum + minimumPadding) * 10) / 10,
  ];
}

function buildAxisTickFormatter(fractionDigits, unit) {
  const tickFormatter = new Intl.NumberFormat("es", { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
  return (tickValue) => (unit ? `${tickFormatter.format(tickValue)} ${unit}` : tickFormatter.format(tickValue));
}
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
    <div className="rounded-md border border-slate-900/10 bg-white p-3 text-xs shadow-sm">
      <p className="mb-1 font-mono text-[11px] text-slate-500">{detailTime.format(label)}</p>
      {payload.filter(({ value }) => Number.isFinite(value)).map(({ dataKey, name, value, unit }) => (
        <p key={dataKey} className="text-slate-700">{name}: <span className="font-mono font-semibold tabular-nums text-slate-950">{number.format(value)} {unit}</span></p>
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
    .sort((a, b) => a.stamp - b.stamp)
    .slice(-VISIBLE_POINT_COUNT);
  const yAxisRule = Y_AXIS_RULES[metric] ?? Y_AXIS_RULES.radiation;
  const yAxisDomain = buildYAxisDomain(yAxisRule);
  const mainAxisUnit = metric === "cardio" ? "" : current.lines[0].unit;
  const visibleTimeSpan = points.length ? points.at(-1).stamp - points[0].stamp : 0;
  const timeTickFormatter = visibleTimeSpan < ONE_DAY_MS ? clockTickFormatter : dayTickFormatter;
  const visibleMoods = [...new Set(points.map(({ mood }) => moodFor(mood)))];

  return (
    <section className={`min-w-0 ${PANEL}`}>
      <div role="group" className="flex flex-wrap gap-1.5" aria-label="Indicador de la gráfica">
        {Object.entries(chartMetrics).map(([key, option]) => (
          <button
            key={key}
            type="button"
            onClick={() => onMetric(key)}
            aria-pressed={metric === key}
            className={`rounded-md border px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${metric === key ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-900/10 text-slate-600 hover:border-slate-900/20 hover:bg-slate-50"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-950">{current.title}</h3>
      {points.length ? (
        <>
          <div role="img" aria-label={`Historial de ${current.title.toLowerCase()}`} className="mt-2 h-64 min-w-0 sm:h-80">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} debounce={50}>
              <LineChart data={points} margin={{ top: 15, right: 32, left: 8, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 5" vertical={false} />
                <XAxis
                  dataKey="stamp" type="category" padding={{ left: 12, right: 12 }}
                  tickFormatter={(value) => timeTickFormatter.format(value)}
                  tick={{ fill: "#475569", fontSize: 11, fontFamily: MONO_FONT_STACK }}
                  axisLine={false} tickLine={false} minTickGap={30} tickCount={4}
                />
                <YAxis
                  width={Y_AXIS_WIDTH} yAxisId="main"
                  tickFormatter={buildAxisTickFormatter(yAxisRule.fractionDigits, mainAxisUnit)}
                  tick={{ fill: "#475569", fontSize: 11, fontFamily: MONO_FONT_STACK }} axisLine={false} tickLine={false}
                  domain={yAxisDomain} tickCount={5}
                />
                {metric === "cardio" && (
                  <YAxis yAxisId="pulse" orientation="right" width={44} domain={yAxisDomain}
                    tick={{ fill: "#1d4ed8", fontSize: 11, fontFamily: MONO_FONT_STACK }} axisLine={false} tickLine={false} />
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
                  <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: color }} /> {name}
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
