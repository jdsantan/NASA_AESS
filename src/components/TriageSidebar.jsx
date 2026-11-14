import React from "react";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { BUTTON, FIELDS, MISSIONS, PANEL, SCENARIOS, TASKS, TOOLS } from "../data/astriaConfig";
import Badge from "./Badge";

export default function TriageSidebar({
  alerts, missing, checked, pendingCount, deliveredCount, latest,
  onOpenGuide, onMarkTask, onSaveReport,
}) {
  return (
    <aside className="grid min-w-0 gap-5" aria-label="Revisión y contramedidas">
      <section className={PANEL} aria-labelledby="triage-title">
        <h2 id="triage-title" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <ShieldAlert size={20} className="text-blue-600" aria-hidden="true" /> Triaje de simulación
        </h2>
        <p className="mt-1 text-xs text-slate-500">Reglas de demostración frente a una referencia sintética.</p>
        {missing.length > 0 && (
          <p className="mt-3 text-xs font-medium text-amber-700" role="status">
            Sin datos: {missing.map((f) => f.label).join(", ")}.
          </p>
        )}
        <div aria-live="polite" className="mt-4 space-y-3">
          {alerts.length === 0 && (
            <p className="flex gap-2 text-sm font-medium text-emerald-700">
              <CheckCircle2 size={18} aria-hidden="true" className="text-emerald-600" />
              {missing.length ? "Lecturas disponibles sin cambios destacados." : "Lecturas dentro de la referencia simulada."}
            </p>
          )}
          {alerts.map((alert) => (
            <article key={alert.title} className={`rounded-xl border p-3 ${TOOLS[alert.level].tone}`}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold">{alert.title}</h3>
                <Badge level={alert.level} />
              </div>
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer rounded font-semibold focus-visible:outline-2 focus-visible:outline-offset-2">Ver orientación de simulación</summary>
                <p className="mt-2 leading-relaxed text-slate-700">
                  Confirma las lecturas y registra su contexto. Consulta al responsable médico o de operaciones según el aviso y revisa el procedimiento vigente de la misión.
                </p>
              </details>
            </article>
          ))}
        </div>
        <button type="button" className={`mt-3 w-full ${BUTTON}`} onClick={onOpenGuide}>
          Guía de autoexamen
        </button>
      </section>

      <section className={PANEL}>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <CheckCircle2 size={20} className="text-blue-600" aria-hidden="true" /> Rutinas diarias
        </h2>
        <div className="mt-3 grid gap-2">
          {TASKS.map(([key, title]) => (
            <label key={key} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 accent-blue-600"
                checked={checked.includes(key)}
                onChange={() => onMarkTask(key)}
              />
              {title}
            </label>
          ))}
        </div>
      </section>

      <section className={PANEL}>
        <h2 className="text-lg font-semibold text-slate-900">Reportes de misión</h2>
        <button type="button" className={`mt-3 w-full ${BUTTON}`} onClick={onSaveReport}>
          Registrar reporte
        </button>
        <div aria-live="polite" className="mt-3 space-y-2 text-xs text-slate-600">
          <p>{pendingCount} pendientes · {deliveredCount} recibidos en servidor</p>
          {latest && (
            <details className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <summary className="cursor-pointer font-semibold text-slate-800">
                Último reporte · {({ pending: "Pendiente", local: "Historial local", delivered: "Recibido en servidor" })[latest.status]}
              </summary>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
                <div className="col-span-2">
                  <dt className="font-medium text-slate-500">{new Date(latest.created).toLocaleString("es")}</dt>
                  <dd className="font-semibold text-slate-800">{MISSIONS[latest.mission]?.name} · {SCENARIOS[latest.scenario]?.title}</dd>
                </div>
                {FIELDS.map(({ key, label, unit }) => (
                  <div key={key}>
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="font-mono font-semibold text-slate-900">{(latest.values[key] === "" || latest.values[key] == null) ? "Sin datos" : `${latest.values[key]} ${unit}`}</dd>
                  </div>
                ))}
                {latest.findings?.length > 0 && (
                  <div className="col-span-2"><dt className="text-slate-500">Avisos</dt><dd className="font-semibold text-amber-800">{latest.findings.join(" · ")}</dd></div>
                )}
                {latest.image && (
                  <div className="col-span-2 break-words">
                    <dt className="text-slate-500">Imagen registrada</dt>
                    <dd className="font-medium text-slate-800">{latest.image.name} {latest.image.note && `· ${latest.image.note}`}</dd>
                  </div>
                )}
              </dl>
            </details>
          )}
        </div>
      </section>
    </aside>
  );
}