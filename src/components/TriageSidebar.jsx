import React from "react";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { BUTTON, FIELDS, MISSIONS, PANEL, SCENARIOS, TASKS, TOOLS } from "../data/astriaConfig.js";
import Badge from "./Badge.jsx";

export default function TriageSidebar({
  alerts, missing, checked, pendingCount, deliveredCount, latest,
  onOpenGuide, onMarkTask, onSaveReport,
}) {
  return (
    <aside className="grid min-w-0 gap-5" aria-label="Revisión y contramedidas">
      {/* 1. Tarjetas de alerta y protocolo de actuación */}
      <section className={PANEL} aria-labelledby="triage-title">
        <h2 id="triage-title" className="flex items-center gap-2 text-lg font-semibold">
          <ShieldAlert size={20} className="text-cyan-300" aria-hidden="true" /> Triaje de simulación
        </h2>
        <p className="mt-1 text-xs text-slate-300">Reglas de demostración frente a una referencia sintética.</p>
        {missing.length > 0 && (
          <p className="mt-3 text-xs text-amber-200" role="status">
            Sin datos: {missing.map((f) => f.label).join(", ")}.
          </p>
        )}
        <div aria-live="polite" className="mt-4 space-y-3">
          {alerts.length === 0 && (
            <p className="flex gap-2 text-sm text-emerald-300">
              <CheckCircle2 size={18} aria-hidden="true" />
              {missing.length ? "Lecturas disponibles sin cambios destacados." : "Lecturas dentro de la referencia simulada."}
            </p>
          )}
          {alerts.map((alert) => (
            <article key={alert.title} className={`rounded-xl border p-3 ${TOOLS[alert.level].tone}`}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold">{alert.title}</h3>
                <Badge level={alert.level} />
              </div>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-slate-200">
                {alert.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </article>
          ))}
        </div>
        <button type="button" className={`mt-3 w-full ${BUTTON}`} onClick={onOpenGuide}>
          Guía de autoexamen
        </button>
      </section>

      {/* 2. Checklist de contramedidas diarias */}
      <section className={PANEL}>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <CheckCircle2 size={20} className="text-cyan-300" aria-hidden="true" /> Rutinas diarias
        </h2>
        <div className="mt-3 grid gap-2">
          {TASKS.map(([key, title]) => (
            <label key={key} className="flex items-center gap-2 rounded-lg bg-[#091221] p-2.5 text-sm text-slate-200">
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 accent-cyan-400"
                checked={checked.includes(key)}
                onChange={() => onMarkTask(key)}
              />
              {title}
            </label>
          ))}
        </div>
      </section>

      {/* 3. Envío e historial de reportes con el Backend */}
      <section className={PANEL}>
        <h2 className="text-lg font-semibold">Reportes de misión</h2>
        <button type="button" className={`mt-3 w-full ${BUTTON}`} onClick={onSaveReport}>
          Registrar reporte
        </button>
        <div aria-live="polite" className="mt-3 space-y-2 text-xs text-slate-300">
          <p>{pendingCount} pendientes · {deliveredCount} recibidos en servidor</p>
          {latest && (
            <details className="rounded-lg border border-slate-800 px-3 py-2.5">
              <summary className="cursor-pointer text-slate-100">
                Último reporte · {({ pending: "Pendiente", delivered: "Recibido en servidor", local: "Historial local" })[latest.status]}
              </summary>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
                <div className="col-span-2">
                  <dt>{new Date(latest.created).toLocaleString("es")}</dt>
                  <dd>{MISSIONS[latest.mission]?.name} · {SCENARIOS[latest.scenario]?.title}</dd>
                </div>
                {FIELDS.map(({ key, label, unit }) => (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd className="text-slate-100">{latest.values[key] === "" || latest.values[key] == null ? "Sin datos" : `${latest.values[key]} ${unit}`}</dd>
                  </div>
                ))}
                {latest.findings?.length > 0 && (
                  <div className="col-span-2"><dt>Avisos</dt><dd>{latest.findings.join(" · ")}</dd></div>
                )}
                {latest.image && (
                  <div className="col-span-2 break-words">
                    <dt>Imagen registrada</dt>
                    <dd>{latest.image.name} {latest.image.note && `· ${latest.image.note}`}</dd>
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
