import { useId } from "react";
import { Pause, Radio } from "lucide-react";
import { FIELDS, INPUT, LABEL, PANEL } from "../data/astriaConfig.js";

const AUTOMATIC_FIELD_KEYS = ["heart", "sleep", "radiation", "oxygen"];
const automaticFields = AUTOMATIC_FIELD_KEYS.map((fieldKey) => FIELDS.find(({ key }) => key === fieldKey));
const manualFields = FIELDS.filter(({ key }) => !AUTOMATIC_FIELD_KEYS.includes(key));

const readingFormatter = new Intl.NumberFormat("es", { maximumFractionDigits: 2 });
const sampleTimeFormatter = new Intl.DateTimeFormat("es", { timeStyle: "medium" });

function FieldSource({ automatic = false }) {
  return (
    <span aria-hidden="true" className={`rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${automatic ? "bg-blue-100 text-blue-900" : "bg-slate-100 text-slate-600"}`}>
      {automatic ? "AUTO" : "MANUAL"}
    </span>
  );
}

function NumericReadingInput({ field, value, automatic = false, onUpdateValue }) {
  const { key, label, unit, min, max, step } = field;

  return (
    <label className={LABEL}>
      <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <span>{label} <span className="font-normal text-slate-600">({unit})</span></span>
        <FieldSource automatic={automatic} />
      </span>
      <input
        className={`${INPUT} font-mono`}
        type="number" min={min} max={max} step={step}
        value={value ?? ""}
        onChange={(event) => {
          const { value: rawValue, valueAsNumber } = event.currentTarget;
          onUpdateValue(key, rawValue === "" || !Number.isFinite(valueAsNumber) ? "" : valueAsNumber);
        }}
        onBlur={(event) => {
          const typedValue = event.currentTarget.valueAsNumber;
          if (Number.isFinite(typedValue) && (typedValue < min || typedValue > max)) {
            onUpdateValue(key, Math.min(max, Math.max(min, typedValue)));
          }
        }}
      />
    </label>
  );
}

function LockedReadingTile({ field, value }) {
  const { label, unit } = field;

  return (
    <div className="min-w-0 rounded-md border border-blue-600/20 bg-blue-50/60 p-2.5 sm:p-3">
      <dt className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold leading-snug text-slate-700">
        {label} <FieldSource automatic />
      </dt>
      <dd className="mt-1.5 font-mono text-lg font-semibold tabular-nums tracking-tight text-slate-950">
        {typeof value === "number" ? readingFormatter.format(value) : "—"}
        <span className="ml-1 text-[11px] font-normal text-slate-500">{unit}</span>
      </dd>
    </div>
  );
}

export default function IndicatorsCard({ values, live, lastSample, onToggleLive, onUpdateValue }) {
  const headingId = useId();
  const lastSampleDate = lastSample == null ? null : new Date(lastSample);
  const hasValidSample = lastSampleDate && Number.isFinite(lastSampleDate.getTime());

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
          className={`inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${live ? "border-emerald-500/40 bg-emerald-50 text-emerald-900 hover:bg-emerald-100" : "border-slate-900/20 bg-slate-50 text-slate-700 hover:bg-slate-100"}`}
        >
          {live ? <Radio size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
          {live ? "Telemetría en vivo" : "Lectura pausada"}
        </button>
      </div>

      <div className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <h3 className="text-sm font-semibold text-slate-800">Lecturas automáticas</h3>
          {hasValidSample && (
            <time className="font-mono text-[11px] tabular-nums text-slate-500" dateTime={lastSampleDate.toISOString()}>
              Última muestra: {sampleTimeFormatter.format(lastSampleDate)}
            </time>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-600" role="status">
          {live ? "Solo lectura mientras la telemetría está en vivo." : "Lectura pausada: puedes escribir cualquier valor para la simulación."}
        </p>
        {live ? (
          <dl className="mt-2 grid grid-cols-2 gap-2">
            {automaticFields.map((field) => <LockedReadingTile key={field.key} field={field} value={values[field.key]} />)}
          </dl>
        ) : (
          <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-3 sm:gap-x-3">
            {automaticFields.map((field) => (
              <NumericReadingInput key={field.key} field={field} value={values[field.key]} automatic onUpdateValue={onUpdateValue} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 border-t border-slate-900/10 pt-4">
        <h3 className="text-sm font-semibold text-slate-800">Entrada manual</h3>
        <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-3 sm:gap-x-3">
          {manualFields.map((field) => (
            <NumericReadingInput key={field.key} field={field} value={values[field.key]} onUpdateValue={onUpdateValue} />
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
