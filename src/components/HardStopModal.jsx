import { useEffect, useId, useRef, useState } from "react";
import { OctagonAlert } from "lucide-react";
import { FIELDS, INSTRUMENT_LABEL } from "../data/astriaConfig.js";
import { alertTitle } from "../utils/telemetryLogic.js";

const readingFormatter = new Intl.NumberFormat("es", { maximumFractionDigits: 2 });

export default function HardStopModal({ member, alert, onResolve }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const [isCountermeasureConfirmed, setIsCountermeasureConfirmed] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog.open) dialog.showModal();
    return () => dialog.close();
  }, []);

  const triggeringReadings = FIELDS.filter(({ key }) => alert.fields.includes(key));
  const { whatHappens, immediateAction } = alert.protocol ?? {};

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => event.preventDefault()}
      className="m-auto w-[min(94vw,36rem)] overflow-hidden rounded-lg border border-slate-900/20 border-t-4 border-t-rose-600 bg-slate-50 p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/70"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-900/10 bg-rose-50 px-5 py-2.5">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-700">
          <OctagonAlert size={15} aria-hidden="true" /> Bloqueo total · Hard-Stop
        </span>
        <span className="font-mono text-[11px] tracking-wider text-slate-600">{member.profile?.callsign}</span>
      </div>

      <div className="px-5 py-5">
        <p className={INSTRUMENT_LABEL}>Anomalía crítica detectada</p>
        <h2 id={titleId} className="mt-1 text-2xl font-semibold tracking-tight text-rose-700">{alertTitle(alert)}</h2>
        <p className="mt-1 text-sm font-medium text-slate-700">{member.name} · {member.profile?.role}</p>

        {triggeringReadings.length > 0 && (
          <dl className="mt-4 flex divide-x divide-slate-900/10 rounded-md border border-rose-500/40 bg-white">
            {triggeringReadings.map(({ key, label, unit }) => (
              <div key={key} className="min-w-0 flex-1 px-4 py-3">
                <dt className={INSTRUMENT_LABEL}>{label}</dt>
                <dd className="mt-1 font-mono text-3xl font-semibold tabular-nums tracking-tight text-rose-700">
                  {readingFormatter.format(member.readings[key])}
                  <span className="ml-1.5 text-sm font-normal text-slate-500">{unit}</span>
                </dd>
              </div>
            ))}
          </dl>
        )}

        {whatHappens && <p className="mt-4 text-sm leading-relaxed text-slate-700">{whatHappens}</p>}

        <div className="mt-4 rounded-md border border-slate-900/15 border-l-4 border-l-blue-600 bg-white px-4 py-3">
          <p className={INSTRUMENT_LABEL}>ASTRIA Protocol · Recomendación médica inmediata</p>
          <p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-950">
            {immediateAction ?? "Consulta el procedimiento vigente de la misión."}
          </p>
        </div>

        <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-md border border-slate-900/20 bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 transition hover:border-blue-600 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blue-600">
          <input
            type="checkbox"
            className="size-5 accent-emerald-600"
            checked={isCountermeasureConfirmed}
            onChange={(event) => setIsCountermeasureConfirmed(event.currentTarget.checked)}
          />
          Confirmo ejecución de contramedida
        </label>

        <button
          type="button"
          disabled={!isCountermeasureConfirmed}
          onClick={onResolve}
          className="mt-3 w-full rounded-md border px-5 py-4 text-sm font-semibold uppercase tracking-[0.1em] transition active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 enabled:border-emerald-700 enabled:bg-emerald-600 enabled:text-slate-50 enabled:hover:bg-emerald-700 disabled:cursor-not-allowed disabled:border-slate-900/10 disabled:bg-slate-200 disabled:text-slate-500"
        >
          Resolver alerta y desbloquear sistema
        </button>
      </div>
    </dialog>
  );
}
