import { BookOpen, ExternalLink } from "lucide-react";
import { PANEL } from "../data/astriaConfig.js";
import { PageHeading } from "./MissionPages.jsx";

const SOURCES = [
  ["Reto y salud en vuelo", [
    ["NASA Space Apps · Enunciado del reto", "https://hackathlone.com/challenges/health-monitoring-software"],
    ["NASA HRP · Peligros del vuelo espacial", "https://www.nasa.gov/hrp/hazards/"],
    ["NASA HRP · Riesgos para la tripulación", "https://www.nasa.gov/hrp/risks/"],
    ["NASA HRP · Investigaciones en curso", "https://www.nasa.gov/hrp/ongoing-hrp-research/"],
    ["CSA · Por qué investigar en el espacio", "https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp"],
  ]],
  ["Radiación y dosimetría", [
    ["CSA · Espectrómetro de neutrones CANS", "https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp"],
    ["CSA · Experimento Radi-N2", "https://www.asc-csa.gc.ca/eng/sciences/radi-n2.asp"],
    ["NASA · Space Radiation Analysis Group", "https://srag.jsc.nasa.gov/spaceradiation/how/how.cfm"],
    ["NASA · Archivo de datos RadLab", "https://visualization.osdr.nasa.gov/radlab/gui/data-api/"],
  ]],
  ["Sueño, gravedad y seguimiento médico", [
    ["NASA · Entorno análogo HERA", "https://www.nasa.gov/hera-about-hera/"],
    ["NASA · Sueño y actividad en ARCHeR", "https://www.nasa.gov/reference/archer/"],
    ["NASA · Cambios neurooculares (SANS)", "https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/"],
    ["NASA · Sistema de descarga de gravedad ARGOS", "https://www.nasa.gov/reference/jsc-eva-systems/"],
    ["NASA · Estudios fisiológicos y del sistema inmune en CIPHER", "https://www.nasa.gov/reference/cipher/"],
    ["NASA · Telemedicina en Tempus Pro", "https://www.nasa.gov/reference/tempus-pro/"],
    ["NASA · Red de comunicaciones con Marte", "https://science.nasa.gov/mars/mars-relay-network/"],
  ]],
];

export default function SourcesPage() {
  return (
    <>
      <PageHeading title="Fuentes de información" description="Documentación del reto y estudios de referencia sobre los riesgos del vuelo espacial." />
      <div className="grid items-start gap-4 lg:grid-cols-3">
        {SOURCES.map(([group, sources]) => (
          <section key={group} className={PANEL}>
            <h3 className="flex items-center gap-2 font-semibold"><BookOpen size={18} className="shrink-0 text-blue-700" aria-hidden="true" />{group}</h3>
            <ul className="mt-3 divide-y divide-slate-900/10">
              {sources.map(([title, url]) => (
                <li key={url}>
                  <a href={url} target="_blank" rel="noreferrer" className="flex items-start justify-between gap-2 rounded py-3 text-sm font-medium text-blue-800 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600">
                    {title}<ExternalLink className="shrink-0" size={14} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
