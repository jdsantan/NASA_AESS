import { Download } from "lucide-react";
import { CREW } from "../data/crew.js";
import { BUTTON, PANEL } from "../data/astriaConfig.js";

const dateFormat = new Intl.DateTimeFormat("es", { dateStyle: "short", timeStyle: "short" });

export function exportReports(reports) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(reports, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "astria-registros.json";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ReportHistory({ reports }) {
  if (!reports.length) return null;

  return (
    <section className={PANEL} aria-labelledby="reports-history">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="reports-history" className="font-semibold">Historial de registros</h3>
        <button type="button" className={`inline-flex items-center gap-2 ${BUTTON}`} onClick={() => exportReports(reports)}>
          <Download size={16} aria-hidden="true" /> Descargar JSON
        </button>
      </div>
      <ul className="mt-3 divide-y divide-slate-900/10">
        {reports.slice(0, 8).map((report) => (
          <li key={report.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
            <span>
              {CREW.find(({ id }) => id === report.memberId)?.name ?? "Registro de misión"} ·{" "}
              {({ manual: "Entrada manual", reference: "Caso de referencia", mixed: "Telemetría de ejemplo y entrada manual", auto: "Telemetría de ejemplo" })[report.source] ?? "Registro anterior"}
            </span>
            <time className="font-mono text-xs tabular-nums text-slate-500" dateTime={report.created}>{dateFormat.format(new Date(report.created))}</time>
          </li>
        ))}
      </ul>
    </section>
  );
}
