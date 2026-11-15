import { useId } from "react";
import { Pause, Radio } from "lucide-react";
import { FIELDS, INPUT, LABEL, PANEL } from "../data/astriaConfig.js";

const AUTO_FIELDS = ["heart", "sleep", "radiation", "oxygen"];
const automatic = AUTO_FIELDS.map((key) => FIELDS.find((field) => field.key === key));
const manual = FIELDS.filter(({ key }) => !AUTO_FIELDS.includes(key));

const formatNumber = new Intl.NumberFormat("es", { maximumFractionDigits: 2 });
const formatDose = new Intl.NumberFormat("es", { maximumFractionDigits: 5 });
const formatTime = new Intl.DateTimeFormat("es", { timeStyle: "medium" });

function FieldSource({ auto = false }) {
  return (
    <span aria-hidden="true" className={`rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${auto ? "bg-blue-100 text-blue-900" : "bg-slate-100 text-slate-600"}`}>
      {auto ? "AUTO" : "MANUAL"}
    </span>
  );
}

export default function IndicatorsCard({ values, live, lastSample, onToggleLive, onUpdateValue }) {
  const headingId = useId();
  const sampleDate = lastSample == null ? null : new Date(lastSample);
  const validSample = sampleDate && Number.isFinite(sampleDate.getTime());
  return (
    <section className={PANEL} aria-labelledby={headingId}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id={headingId} className="text-lg font-semibold text-slate-900">Indicadores</h2>
          <p className="mt-0.5 text-xs text-slate-600">Telemetría de ejemplo</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-label="Telemetría en vivo"
          aria-checked={live}
          onClick={onToggleLive}
          className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${live ? "border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100" : "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"}`}
        >
          {live ? <Radio size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
          {live ? "Telemetría en vivo" : "Lectura pausada"}
        </button>
      </div>

      <div className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <h3 className="text-sm font-semibold text-slate-800">Lecturas automáticas</h3>
          {validSample && (
            <time className="text-xs tabular-nums text-slate-600" dateTime={sampleDate.toISOString()}>
              Última muestra: {formatTime.format(sampleDate)}
            </time>
          )}
        </div>
        <dl className="mt-2 grid grid-cols-2 gap-2">
          {automatic.map(({ key, label, unit }) => {
            const value = values[key];
            return (
              <div key={key} className="min-w-0 rounded-lg border border-blue-100 bg-blue-50/60 p-2.5 sm:p-3">
                <dt className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold leading-snug text-slate-700">
                  {label} <FieldSource auto />
                </dt>
                <dd className="mt-1.5 text-base font-semibold tabular-nums text-slate-950">
                  {typeof value === "number" ? (key === "radiation" ? formatDose : formatNumber).format(value) : "—"}
                  <span className="ml-1 text-xs font-medium text-slate-600">{unit}</span>
                </dd>
              </div>
            );
          })}
        </dl>
      </div>

      <div className="mt-5 border-t border-slate-200 pt-4">
        <h3 className="text-sm font-semibold text-slate-800">Entrada manual</h3>
        <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-3 sm:gap-x-3">
          {manual.map(({ key, label, unit, min, max, step }) => (
            <label className={LABEL} key={key}>
              <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                <span>{label} <span className="font-normal text-slate-600">({unit})</span></span>
                <FieldSource />
              </span>
              <input
                className={`${INPUT} font-mono`}
                type="number" min={min} max={max} step={step}
                value={values[key] ?? ""}
                onChange={(event) => {
                  const { value, valueAsNumber } = event.currentTarget;
                  onUpdateValue(key, value === "" || !Number.isFinite(valueAsNumber) ? "" : valueAsNumber);
                }}
                onBlur={(event) => {
                  const value = event.currentTarget.valueAsNumber;
                  if (Number.isFinite(value) && (value < min || value > max)) {
                    onUpdateValue(key, Math.min(max, Math.max(min, value)));
                  }
                }}
              />
            </label>
          ))}
          <label className={`col-span-2 ${LABEL}`}>
            <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">Estado de ánimo <FieldSource /></span>
            <select className={INPUT} value={values.mood} onChange={(event) => onUpdateValue("mood", event.currentTarget.value)}>
              <option value="estable">Estable</option>
              <option value="fatiga">Fatiga</option>
              <option value="estrés">Estrés</option>
              {values.mood === "bajo" && <option value="bajo">Ánimo bajo</option>}
            </select>
          </label>
        </div>
        <label className="mt-3 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            className="size-4 accent-blue-600"
            checked={Boolean(values.visual)}
            onChange={(event) => onUpdateValue("visual", event.currentTarget.checked)}
          />
          Reportar cambio visual <FieldSource />
        </label>
      </div>
    </section>
  );
}
