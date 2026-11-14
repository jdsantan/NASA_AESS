import { useState } from "react";
import { Activity, ArrowLeft, Bell, BookOpen, ChartNoAxesCombined, ChevronRight, ClipboardList, FlaskConical, MessageSquare, Users } from "lucide-react";
import Badge from "../components/Badge.jsx";
import BodyMap from "../components/BodyMap.jsx";
import TrendChart from "../components/TrendChart.jsx";
import { BASELINE, FIELDS, PANEL, SCENARIOS, SYSTEMS, TOOLS } from "../data/astriaConfig.js";
import { assess } from "../utils/telemetryLogic.js";

const focus = "outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";
const number = new Intl.NumberFormat("es", { maximumFractionDigits: 1 });
const FIELD_GROUPS = {
  neuro: ["sleep", "mood", "visual"],
  cardio: ["heart", "systolic", "diastolic"],
  bone: ["bone", "exercise"],
  resp: ["radiation", "oxygen", "temperature", "glucose"],
};
const BODY_FIELDS = {
  ...Object.fromEntries(FIELDS.map(({ key, label, unit }) => [key, { label, unit }])),
  mood: { label: "Estado de ánimo" },
  visual: { label: "Cambios visuales" },
  bone: { label: "Densidad ósea simulada", unit: "%" },
  exercise: { label: "Rutina de ejercicio" },
};
const GUIDANCE = {
  neuro: ["Confirma las horas de sueño, el estado de ánimo y la hora en que se observó el cambio.", "Si el cambio persiste, comparte el registro con el responsable médico para decidir si hace falta una evaluación adicional."],
  cardio: ["Verifica el equipo y registra una segunda lectura siguiendo la guía del dispositivo.", "Comparte las dos lecturas con el responsable médico si la diferencia persiste."],
  bone: ["Revisa el cumplimiento de la rutina de ejercicio programada y registra cualquier cambio.", "Consulta al responsable médico si la tripulación necesita revisar la rutina."],
  resp: ["Confirma la fuente, la unidad y la hora de los datos. Identifica cuáles corresponden al ambiente y cuáles a la persona.", "Comparte las lecturas con el responsable de la misión para revisar el caso según su procedimiento."],
};

export function MissionNav({ page }) {
  const links = [
    ["/", "Dashboard", Activity],
    ["/integrantes", "Integrantes", Users],
    ["/tendencias", "Tendencias", ChartNoAxesCombined],
    ["/actividades", "Actividades", MessageSquare],
    ["/fuentes", "Fuentes", BookOpen],
    ["/simulador", "Simulador", FlaskConical],
  ];
  return (
    <nav aria-label="Navegación principal" className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap gap-1 px-4 py-2 sm:px-8">
        {links.map(([path, label, Icon]) => {
          const active = page === path || (path === "/integrantes" && page.startsWith(path + "/"));
          return (
            <a key={path} href={"#" + path} aria-current={active ? "page" : undefined}
              className={`flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold ${focus} ${active ? "bg-blue-50 text-blue-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}>
              <Icon size={16} aria-hidden="true" /> {label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

export function PageHeading({ title, description, back = "/", backLabel = "Volver al dashboard", children }) {
  return (
    <div className="mb-6">
      {back && (
        <a href={"#" + back} className={`mb-3 inline-flex min-h-9 items-center gap-2 rounded text-sm font-semibold text-blue-800 hover:underline ${focus}`}>
          <ArrowLeft size={16} aria-hidden="true" /> {backLabel}
        </a>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="page-title" className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
          {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{description}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function DashboardSummary({ mission, scenario, alerts, missing, pendingCount, crew }) {
  const level = alerts[0]?.level ?? (missing.length ? "warn" : "ok");
  const critical = crew.flatMap((member) => member.alerts
    .filter((alert) => alert.level === "critical").map((alert) => ({ member, alert })));
  return (
    <div className="grid gap-5">
      <section className={PANEL} aria-label="Escenario general">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-600">{mission.name} · {mission.gravity}</p>
            <h3 className="mt-1 text-xl font-semibold">{SCENARIOS[scenario].title}</h3>
            <p className="mt-2 text-sm text-slate-600">{alerts.length} {alerts.length === 1 ? "aviso del simulador" : "avisos del simulador"} · {pendingCount} {pendingCount === 1 ? "reporte pendiente" : "reportes pendientes"}</p>
            {alerts[0] && <p className="mt-1 text-sm font-medium text-slate-800">{alertTitle(alerts[0])}</p>}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Badge level={level} />
            <a className={`rounded py-1 text-sm font-semibold text-blue-800 hover:underline ${focus}`} href="#/simulador">Abrir simulador</a>
          </div>
        </div>
      </section>
      <section className={PANEL} aria-labelledby="attention-title">
        <h3 id="attention-title" className="flex items-center gap-2 text-lg font-semibold"><Bell size={18} aria-hidden="true" /> Notificaciones de misión</h3>
        <div className="mt-3 space-y-2" aria-live="assertive" aria-relevant="additions text">
          {critical.length === 0 && <p className="text-sm text-slate-600">Sin avisos críticos en la tripulación.</p>}
          {critical.map(({ member, alert }) => (
            <a key={member.id + alert.title} href={"#/integrantes/" + member.id}
              className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border p-3 text-sm ${TOOLS.critical.tone} ${focus}`}>
              <Badge level="critical" />
              <strong>{member.name}</strong>
              <span>{alertTitle(alert)}</span>
              <ChevronRight size={16} className="ml-auto" aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>
      <section aria-labelledby="crew-summary-title">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 id="crew-summary-title" className="text-lg font-semibold">Estado de la tripulación</h3>
          <a href="#/integrantes" className={`rounded text-sm font-semibold text-blue-800 hover:underline ${focus}`}>Ver integrantes</a>
        </div>
        <CrewCards crew={crew} summary />
      </section>
    </div>
  );
}

export function crewTelemetry(member, routines) {
  const scenario = SCENARIOS[member.scenario];
  const checked = routines.filter(({ done }) => done).map(({ id }) => id);
  if (!routines.some(({ id }) => id === "exercise")) checked.push("exercise");
  const exercise = routines.find(({ id }) => id === "exercise");
  const readings = {
    ...BASELINE,
    ...scenario.values,
    bone: scenario.bone,
    exercise: exercise ? (exercise.done ? "Completada" : "Pendiente") : "Sin asignar",
  };
  const alerts = assess(readings, member.scenario, checked);
  return { ...member, readings, alerts, level: alerts[0]?.level ?? "ok" };
}

export function CrewPage({ crew }) {
  return (
    <>
      <PageHeading title="Integrantes" description="Selecciona una ficha para revisar el estado, las observaciones y los indicadores de la tripulación simulada." />
      <CrewCards crew={crew} />
    </>
  );
}

function CrewCards({ crew, summary = false }) {
  return (
      <ul className={`grid gap-4 sm:grid-cols-2 ${summary ? "xl:grid-cols-4" : ""}`}>
        {crew.map((member) => {
          const { level } = member;
          return (
            <li key={member.id}>
              <a href={"#/integrantes/" + member.id} className={`group flex h-full items-center gap-4 transition hover:border-blue-400 hover:shadow-md ${PANEL} ${focus}`}>
                <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-50 font-semibold text-blue-800">
                  {member.name.split(" ").map((part) => part[0]).join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-950">{member.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {summary ? (member.alerts[0] ? alertTitle(member.alerts[0]) : "Sin cambios destacados.") : SCENARIOS[member.scenario].title}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge level={level} />
                  <ChevronRight size={18} aria-hidden="true" className="hidden text-blue-700 transition group-hover:translate-x-0.5 sm:block" />
                </div>
              </a>
            </li>
          );
        })}
      </ul>
  );
}

function alertTitle(alert) {
  return alert.title.split(" (Fuente:")[0].replace(/\[cite:[^\]]+\]/g, "").trim();
}

function RecommendationPanel({ alerts }) {
  const groups = [...new Set(alerts.map(({ group }) => group))];
  return (
    <details className={`group ${PANEL}`}>
      <summary className={`flex cursor-pointer list-none items-center gap-3 rounded-md font-semibold text-blue-800 [&::-webkit-details-marker]:hidden ${focus}`}>
        <ClipboardList size={19} aria-hidden="true" />
        Ver recomendaciones
        <ChevronRight size={18} aria-hidden="true" className="ml-auto transition group-open:rotate-90" />
      </summary>
      <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
        <p className="text-sm text-slate-600">Orientación para este escenario simulado.</p>
        {groups.length === 0 && <p className="text-sm text-slate-700">Continúa con el registro diario. Documenta cualquier cambio que aparezca en la siguiente medición.</p>}
        {groups.map((group) => (
          <section key={group}>
            <h3 className="font-semibold text-slate-950">{SYSTEMS[group].name}</h3>
            <p className="mt-1 text-sm text-slate-700">La simulación marcó {alerts.filter((alert) => alert.group === group).map(alertTitle).join(" · ")}.</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-700">
              {GUIDANCE[group].map((step) => <li key={step}>{step}</li>)}
            </ul>
          </section>
        ))}
      </div>
    </details>
  );
}

export function MemberPage({ member, children }) {
  const { readings, alerts, level } = member;
  const [selected, setSelected] = useState(alerts[0]?.group ?? "neuro");
  const statuses = Object.fromEntries(
    Object.keys(SYSTEMS).map((key) => [key, alerts.find((alert) => alert.group === key)?.level ?? "ok"]),
  );
  const relevant = alerts.filter((alert) => alert.group === selected);
  const indicatorStatus = (key) => alerts.find((alert) => alert.fields.includes(key))?.level ?? "ok";

  return (
    <>
      <PageHeading title={member.name} description={`Perfil simulado · ${SCENARIOS[member.scenario].title}`} back="/integrantes" backLabel="Volver a integrantes">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <span className="text-sm font-semibold text-slate-700">Estado actual</span><Badge level={level} />
        </div>
      </PageHeading>
      <div className="mb-5 grid items-start gap-5 lg:grid-cols-2">
        <BodyMap statuses={statuses} selected={selected} onSelect={setSelected} />
        <section className={PANEL} aria-live="polite" aria-labelledby="zone-title">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id="zone-title" className="text-lg font-semibold">{SYSTEMS[selected].name}</h3>
            <Badge level={statuses[selected]} />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
            {FIELD_GROUPS[selected].map((key) => {
              const { label, unit } = BODY_FIELDS[key];
              const value = readings[key];
              let text = String(value);
              if (typeof value === "boolean") text = value ? "Sí" : "Sin cambios reportados";
              if (typeof value === "number") text = number.format(value) + (unit ? " " + unit : "");
              return (
                <div key={key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <dt className="text-xs font-medium text-slate-600">{label}</dt>
                  <dd className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-950">
                    {text}
                    {key === "exercise" ? null : <Badge level={indicatorStatus(key)} />}
                  </dd>
                </div>
              );
            })}
          </dl>
          <h4 className="mt-5 text-sm font-semibold">Observaciones de la zona</h4>
          {relevant.length ? (
            <ul className="mt-2 grid gap-2">
              {relevant.map((alert) => (
                <li key={alert.title} className={`rounded-lg border px-3 py-2 text-sm ${TOOLS[alert.level].tone}`}>{alertTitle(alert)}</li>
              ))}
            </ul>
          ) : <p className="mt-1 text-sm text-slate-600">Las reglas del escenario no marcaron cambios en esta zona.</p>}
        </section>
      </div>
      <RecommendationPanel alerts={alerts} />
      {children}
    </>
  );
}

export function TrendsPage({ scenario, history, metric, onMetric }) {
  return (
    <>
      <PageHeading title="Tendencias" description={`Historial del escenario simulado · ${SCENARIOS[scenario].title}`} />
      <TrendChart history={history} metric={metric} onMetric={onMetric} />
    </>
  );
}
