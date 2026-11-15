import { Activity } from "lucide-react";
import { PANEL, READOUT_TILE, READOUT_VALUE } from "../data/astriaConfig.js";

const number = new Intl.NumberFormat("es", { maximumFractionDigits: 1 });

function mean(crew, key) {
  const readings = crew.map(({ values, readings }) => (values ?? readings)?.[key]).filter(Number.isFinite);
  return readings.length
    ? readings.reduce((sum, value) => sum + value, 0) / readings.length
    : undefined;
}

function format(value) {
  return Number.isFinite(value) ? number.format(value) : "—";
}

export default function CrewIndicators({ crew, oxygen }) {
  const systolic = mean(crew, "systolic");
  const diastolic = mean(crew, "diastolic");
  const pressure = systolic == null && diastolic == null
    ? "—"
    : `${format(systolic)} / ${format(diastolic)}`;
  const metrics = [
    ["Pulso en reposo", format(mean(crew, "heart")), "lpm"],
    ["Presión arterial", pressure, "mmHg"],
    ["Glucosa", format(mean(crew, "glucose")), "mg/dL"],
    ["Temperatura corporal", format(mean(crew, "temperature")), "°C"],
    ["Horas de sueño", format(mean(crew, "sleep")), "h"],
    ["Dosis personal acumulada", format(mean(crew, "radiation")), "mSv"],
    ["Oxígeno de cabina", format(oxygen), "%"],
  ];

  return (
    <section className={PANEL} aria-labelledby="crew-indicators-title">
      <h3 id="crew-indicators-title" className="flex items-center gap-2 text-lg font-semibold">
        <Activity size={18} className="text-blue-700" aria-hidden="true" />
        Indicadores de la tripulación
      </h3>
      <p className="mt-1 text-sm text-slate-600">Promedios de las lecturas disponibles.</p>
      <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {metrics.map(([label, value, unit]) => (
          <div key={label} className={`px-3 py-2.5 ${READOUT_TILE}`}>
            <dt className="text-xs font-semibold leading-snug text-slate-600">{label}</dt>
            <dd className={`mt-1 text-lg ${READOUT_VALUE}`}>
              {value === "—" ? <span className="font-sans text-sm font-normal text-slate-600">Sin datos</span> : (
                <>{value} <span className="text-[11px] font-normal text-slate-500">{unit}</span></>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
