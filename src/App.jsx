import React, { useEffect, useRef, useState } from "react";
import {
  Activity, Award, Bone, Brain, CheckCircle2, Clock, Heart, Radio,
  ShieldAlert, Upload, Wind, X,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const STORAGE = "astria-monitor-v1";
const PANEL = "rounded-2xl border border-slate-800 bg-[#0e1727] p-4 shadow-lg shadow-black/15 sm:p-5";
const LABEL = "block text-xs font-medium text-slate-300";
const INPUT = "mt-1.5 w-full rounded-lg border border-slate-700 bg-[#091221] px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50";
const BUTTON = "rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400/70 hover:bg-cyan-400/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 disabled:opacity-50";

const MISSIONS = {
  iss: { name: "Estación Espacial · ISS", delay: 0, latency: "0 s (redondeado)", gravity: "≈ 0 g" },
  transit: { name: "Nave en tránsito", delay: 720, latency: "12 min", gravity: "≈ 0 g" },
  moon: { name: "Base lunar · Artemis", delay: 1.3, latency: "1,3 s", gravity: "1/6 g" },
  mars: { name: "Base marciana", delay: 1200, latency: "20 min · 40 min ida/vuelta", gravity: "3/8 g" },
};

const BASELINE = {
  heart: 68, systolic: 116, diastolic: 75, glucose: 92, temperature: 36.7,
  sleep: 7.8, radiation: 7, oxygen: 21, mood: "estable", visual: false,
};

const SCENARIOS = {
  nominal: { title: "Estado nominal", values: {}, bone: 99.2 },
  solar: { title: "Tormenta solar", values: { radiation: 24 }, bone: 99.2 },
  sans: { title: "Cambios visuales · SANS simulado", values: { visual: true, heart: 78, systolic: 129 }, bone: 99.0 },
  oxygen: { title: "Evento de O₂ en cabina · pre-EVA", values: { oxygen: 18.2, heart: 98 }, bone: 99.0 },
  fatigue: { title: "Fatiga y aislamiento", values: { sleep: 4.9, mood: "bajo", heart: 83 }, bone: 98.8 },
};

const FIELDS = [
  { key: "heart", label: "Pulso en reposo", unit: "lpm", min: 0, max: 300, step: 1 },
  { key: "systolic", label: "Presión sistólica", unit: "mmHg", min: 0, max: 300, step: 1 },
  { key: "diastolic", label: "Presión diastólica", unit: "mmHg", min: 0, max: 300, step: 1 },
  { key: "glucose", label: "Glucosa", unit: "mg/dL", min: 0, max: 1000, step: 1 },
  { key: "temperature", label: "Temperatura corporal", unit: "°C", min: 0, max: 60, step: 0.1 },
  { key: "sleep", label: "Horas de sueño", unit: "h", min: 0, max: 24, step: 0.1 },
  { key: "radiation", label: "Dosis personal acumulada", unit: "mSv", min: 0, max: 5000, step: 0.1 },
  { key: "oxygen", label: "Oxígeno de cabina", unit: "%", min: 0, max: 100, step: 0.1 },
];

const SYSTEMS = {
  neuro: { name: "Sistema nervioso y ojos", icon: Brain, detail: "El sueño y el aislamiento influyen en la atención. En microgravedad, el desplazamiento de fluidos se estudia en relación con cambios oculares." },
  cardio: { name: "Sistema cardiovascular", icon: Heart, detail: "El pulso y la presión aportan contexto sobre la adaptación cardiovascular. Las lecturas de este escenario se comparan con la referencia individual simulada." },
  bone: { name: "Sistema musculoesquelético", icon: Bone, detail: "La reducción de carga mecánica afecta músculos y huesos. La curva ósea de la demo es sintética y la lista de ejercicio registra el cumplimiento de la rutina." },
  resp: { name: "Sistema inmune y respiratorio", icon: Wind, detail: "El oxígeno de cabina describe el ambiente. La dosimetría personal registra exposición individual. Cada señal conserva su unidad y se revisa por separado." },
};

const TASKS = [
  ["exercise", "Ejercicio programado de la misión"],
  ["nutrition", "Registro de hidratación y alimentación"],
  ["journal", "Diario emocional o chequeo cognitivo"],
  ["eva", "Revisión de lista previa a EVA"],
];

const TOOLS = {
  ok: { text: "Óptimo", tone: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" },
  warn: { text: "Precaución", tone: "border-amber-400/30 bg-amber-400/10 text-amber-200" },
  critical: { text: "Crítico", tone: "border-rose-400/35 bg-rose-400/10 text-rose-300" },
};

function dateKey(date = new Date()) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(
    (part) => String(part).padStart(2, "0"),
  ).join("-");
}

function shiftDate(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function initialState() {
  const defaults = {
    mission: "transit", scenario: "nominal", connection: true, values: BASELINE,
    daily: {}, reports: [], imageRecord: null,
  };
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE));
    if (!saved || typeof saved !== "object") return defaults;
    return {
      ...defaults, ...saved,
      mission: MISSIONS[saved.mission] ? saved.mission : defaults.mission,
      scenario: SCENARIOS[saved.scenario] ? saved.scenario : defaults.scenario,
      values: { ...BASELINE, ...saved.values },
      daily: saved.daily && typeof saved.daily === "object" ? saved.daily : {},
      reports: Array.isArray(saved.reports) ? saved.reports : [],
    };
  } catch {
    return defaults;
  }
}

function assess(values, scenario, checked) {
  const alerts = [];
  const add = (group, level, title, steps) => alerts.push({ group, level, title, steps });
  const number = (field) => values[field] === "" ? null : Number(values[field]);
  const oxygen = number("oxygen");
  const radiation = number("radiation");
  const sleep = number("sleep");
  const heart = number("heart");
  const bloodPressure = number("systolic");
  const diastolic = number("diastolic");
  const glucose = number("glucose");
  const temperature = number("temperature");
  if (oxygen !== null && Math.abs(oxygen - BASELINE.oxygen) >= 2) {
    add("resp", "critical", "Evento de oxígeno de cabina", [
      "Comprueba la unidad, el sensor de cabina y la hora de la lectura.",
      "Avisa al responsable de operaciones. Consulta la lista de contingencia aprobada para el vehículo.",
    ]);
  }
  if (radiation !== null && radiation - BASELINE.radiation >= 10) {
    add("resp", "critical", "Aumento de dosis registrada", [
      "Verifica el dosímetro, el intervalo de lectura y el contexto de la misión.",
      "Comunica el evento a control de misión y consulta el procedimiento de radiación vigente.",
    ]);
  }
  if (values.visual) {
    add("neuro", "warn", "Cambio visual informado", [
      "Registra cuándo comenzó el cambio y el contexto en que apareció.",
      "Adjunta un registro si existe y prepara el caso para el responsable médico.",
    ]);
  }
  if ((sleep !== null && BASELINE.sleep - sleep >= 1.5) || values.mood === "bajo") {
    add("neuro", "warn", "Cambio de sueño o ánimo", [
      "Confirma el registro de sueño y anota los cambios de turno y el nivel de fatiga.",
      "Revisa la rutina de descanso acordada con la misión y comparte la tendencia si persiste.",
    ]);
  }
  if ((heart !== null && Math.abs(heart - BASELINE.heart) >= 14)
      || (bloodPressure !== null && Math.abs(bloodPressure - BASELINE.systolic) >= 18)
      || (diastolic !== null && Math.abs(diastolic - BASELINE.diastolic) >= 12)
      || (bloodPressure !== null && diastolic !== null && diastolic >= bloodPressure)) {
    add("cardio", "warn", "Cambio cardiovascular registrado", [
      "Comprueba la calidad de la señal y repite la medición siguiendo la guía del equipo.",
      "Guarda ambas lecturas y deriva el caso al responsable médico si la diferencia persiste.",
    ]);
  }
  if ((glucose !== null && Math.abs(glucose - BASELINE.glucose) >= 25)
      || (temperature !== null && Math.abs(temperature - BASELINE.temperature) >= 1)) {
    add("resp", "warn", "Cambio de glucosa o temperatura", [
      "Confirma la unidad y registra el contexto de la medición.",
      "Comparte el registro con el responsable médico para su revisión.",
    ]);
  }
  if (scenario === "fatigue" && !checked.includes("exercise")) {
    add("bone", "warn", "Rutina de ejercicio pendiente", [
      "Consulta la rutina programada y registra si quedó completada, pendiente o reprogramada.",
    ]);
  }
  return alerts.sort((a, b) => Number(b.level === "critical") - Number(a.level === "critical"));
}

function historyFor(scenario, values) {
  const today = new Date();
  const fmt = new Intl.DateTimeFormat("es", { day: "numeric", month: "short" });
  const templates = {
    radiation: [1.5, 2.2, 3.3, 4.1, 5.0, 6.1],
    sleep: scenario === "fatigue" ? [8, 7.5, 7.3, 6.7, 6.0, 5.4] : [7.7, 7.3, 8.1, 7.7, 8, 7.4],
    bone: [99.9, 99.8, 99.7, 99.6, 99.5, 99.4],
  };
  return Array.from({ length: 7 }, (_, index) => ({
    day: fmt.format(shiftDate(today, index - 6)),
    radiation: index === 6 ? (values.radiation === "" ? null : values.radiation) : templates.radiation[index],
    sleep: index === 6 ? (values.sleep === "" ? null : values.sleep) : templates.sleep[index],
    bone: index === 6 ? SCENARIOS[scenario].bone : templates.bone[index],
  }));
}

function Badge({ level }) {
  const style = TOOLS[level];
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${style.tone}`}>{style.text}</span>;
}

function Guide({ dialogRef }) {
  return (
    <dialog ref={dialogRef} aria-labelledby="guide-title" className="m-auto w-[min(94vw,32rem)] rounded-2xl border border-slate-700 bg-[#0e1727] p-6 text-slate-100 backdrop:bg-black/70">
      <div className="flex items-center justify-between gap-4">
        <h2 id="guide-title" className="text-xl font-semibold">Guía de autoexamen</h2>
        <form method="dialog">
          <button aria-label="Cerrar guía" className={BUTTON}><X size={18} aria-hidden="true" /></button>
        </form>
      </div>
      <div className="mt-5 space-y-5 text-sm leading-relaxed text-slate-300">
        <section>
          <h3 className="mb-1 font-semibold text-cyan-200">Dosímetro personal</h3>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Verifica que el identificador corresponda al tripulante y sigue la ficha del dispositivo de la misión.</li>
            <li>Registra valor, unidad, periodo de acumulación y hora de lectura.</li>
            <li>Marca la lectura para revisión si falta la unidad o el dispositivo informa un fallo.</li>
          </ol>
        </section>
        <section>
          <h3 className="mb-1 font-semibold text-cyan-200">Registro de ultrasonido o imagen ocular</h3>
          <p>Usa la guía oficial del equipo con la persona autorizada a bordo. Adjunta únicamente una imagen de demostración. Ingresa la fecha y el contexto en la nota de revisión.</p>
        </section>
      </div>
    </dialog>
  );
}

export default function App() {
  const [state, setState] = useState(initialState);
  const [selected, setSelected] = useState("neuro");
  const [metric, setMetric] = useState("radiation");
  const [day, setDay] = useState(dateKey);
  const [image, setImage] = useState(null);
  const [imageError, setImageError] = useState("");
  const [note, setNote] = useState("");
  const imageRecord = state.imageRecord;
  const [storageError, setStorageError] = useState(false);
  const guide = useRef(null);
  const mission = MISSIONS[state.mission];
  const values = state.values;
  const checked = state.daily[day] || [];
  const alerts = assess(values, state.scenario, checked);
  const readiness = Math.round(100 * checked.length / TASKS.length);
  const missing = FIELDS.filter(({ key }) => values[key] === "");
  const missingSystems = {
    neuro: values.sleep === "",
    cardio: [values.heart, values.systolic, values.diastolic].includes(""),
    resp: [values.oxygen, values.radiation, values.temperature, values.glucose].includes(""),
  };
  const statuses = Object.fromEntries(Object.keys(SYSTEMS).map((key) => [
    key, alerts.find((alert) => alert.group === key)?.level || (missingSystems[key] ? "warn" : "ok"),
  ]));
  const activeSystem = SYSTEMS[selected];
  const SystemIcon = activeSystem.icon;
  const selectedAlert = alerts.find((alert) => alert.group === selected);
  let streak = 0;
  const now = new Date();
  if (checked.length !== TASKS.length) now.setTime(shiftDate(now, -1).getTime());
  while (state.daily[dateKey(shiftDate(now, -streak))]?.length === TASKS.length) streak += 1;

  useEffect(() => {
    const timer = window.setInterval(() => setDay(dateKey()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE, JSON.stringify(state));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state]);

  useEffect(() => () => {
    if (image) URL.revokeObjectURL(image.url);
  }, [image]);

  function chooseScenario(scenario) {
    setState((current) => ({ ...current, scenario, values: { ...BASELINE, ...SCENARIOS[scenario].values } }));
  }

  function updateValue(key, value) {
    setState((current) => ({ ...current, values: { ...current.values, [key]: value } }));
  }

  function markTask(key) {
    setState((current) => {
      const tasks = current.daily[day] || [];
      return {
        ...current,
        daily: {
          ...current.daily,
          [day]: tasks.includes(key) ? tasks.filter((task) => task !== key) : [...tasks, key],
        },
      };
    });
  }

  function openImage(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setImageError("Selecciona una imagen PNG, JPG o WebP de hasta 10 MB.");
      return;
    }
    setImageError("");
    setNote("");
    setImage({ name: file.name, url: URL.createObjectURL(file) });
  }

  const latest = state.reports[0];
  const pendingCount = state.reports.filter((report) => report.status === "pending").length;

  function saveReport() {
    const id = globalThis.crypto?.randomUUID?.() ?? (String(Date.now()) + "-" + Math.random().toString(36).slice(2));
    const created = new Date().toISOString();
    setState((current) => ({
      ...current,
      reports: [{
        id, created, mission: current.mission, scenario: current.scenario, values: current.values,
        findings: assess(current.values, current.scenario, current.daily[day] || []).map((alert) => alert.title),
        status: current.connection ? "delivered" : "pending",
        image: imageRecord,
      }, ...current.reports],
    }));
  }

  function toggleLink() {
    setState((current) => ({
      ...current,
      connection: !current.connection,
      reports: current.connection ? current.reports : current.reports.map((report) =>
        report.status === "pending" ? { ...report, status: "delivered" } : report),
    }));
  }

  const guideButton = (
    <button type="button" className={`mt-3 w-full ${BUTTON}`} onClick={() => guide.current?.showModal()}>
      Guía de autoexamen
    </button>
  );

  return (
    <div className="min-h-screen bg-[#080e19] font-sans text-slate-100 selection:bg-cyan-400/25">
      <header className="border-b border-slate-800 bg-[radial-gradient(ellipse_at_top_left,#123044,transparent_65%)]">
        <div className="mx-auto max-w-[1570px] px-4 py-6 sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-2.5 text-cyan-300"><Activity size={27} aria-hidden="true" /></div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">ASTRIA</h1>
                <p className="mt-1 text-xs font-medium tracking-widest text-slate-300">HRP HEALTH MONITOR</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className={BUTTON} onClick={toggleLink}>
                <Radio size={16} aria-hidden="true" className={`mr-2 inline ${state.connection ? "text-emerald-300" : "text-amber-300"}`} />
                {state.connection ? "Simular corte de enlace" : "Restablecer enlace"}
              </button>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-[1.25fr_1fr_1fr]">
            <label className={LABEL}>
              Entorno de misión
              <select className={INPUT} value={state.mission} onChange={(event) => {
                const next = event.currentTarget.value;
                setState((current) => ({ ...current, mission: next }));
              }}>
                {Object.entries(MISSIONS).map(([key, item]) => <option key={key} value={key}>{item.name}</option>)}
              </select>
            </label>
            <div className="rounded-xl border border-slate-800 bg-[#0b1524] px-3 py-2.5">
              <p className="flex items-center gap-2 text-xs text-slate-300"><Clock size={14} aria-hidden="true" /> Retraso simulado por trayecto</p>
              <p className="mt-1 font-mono text-sm text-cyan-200">{mission.latency} <span className="ml-2 text-slate-300">{mission.gravity}</span></p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#0b1524] px-3 py-2.5 sm:col-span-2 xl:col-span-1">
              <div className="flex justify-between gap-2 text-xs text-slate-200">
                <span className="flex items-center gap-2"><Award size={15} aria-hidden="true" /> Preparación de misión</span>
                <b className="font-mono text-cyan-200">{readiness}%</b>
              </div>
              <progress aria-label="Preparación de misión según rutinas completadas" className="mt-2 block h-2 w-full accent-cyan-400" value={readiness} max={100} />
              <p className="mt-1 text-xs text-slate-300">{checked.length}/{TASKS.length} rutinas · Racha de {streak} {streak === 1 ? "día" : "días"}</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-300" role="status">
            Simulación educativa <span className="px-2 text-slate-500">·</span>
            {state.connection ? "Enlace disponible" : "Enlace interrumpido"}
            {(mission.delay > 300 || !state.connection) && <span className="ml-2 font-semibold text-amber-300">· Modo autónomo de triaje activo</span>}
          </p>
          {storageError && <p role="alert" className="mt-2 text-xs text-amber-200">El navegador impide guardar los cambios al recargar.</p>}
        </div>
      </header>

      <main className="mx-auto grid max-w-[1570px] items-start gap-5 px-4 py-6 sm:px-8 xl:grid-cols-[minmax(245px,0.85fr)_minmax(350px,1.4fr)_minmax(280px,1fr)]">
        <aside className="grid min-w-0 gap-5" aria-label="Adquisición de datos">
          <section className={PANEL}>
            <h2 className="text-lg font-semibold">Escenario simulado</h2>
            <div className="mt-3 grid gap-1.5" aria-label="Cargar lecturas de ejemplo" role="group">
              {Object.entries(SCENARIOS).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={state.scenario === key}
                  className={`${BUTTON} text-left aria-pressed:border-cyan-400/60 aria-pressed:bg-cyan-400/10 aria-pressed:text-cyan-100`}
                  onClick={() => chooseScenario(key)}
                >
                  {item.title}
                </button>
              ))}
            </div>
          </section>

          <section className={PANEL}>
            <h2 className="text-lg font-semibold">Indicadores</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {FIELDS.map(({ key, label, unit, min, max, step }) => (
                <label className={LABEL} key={key}>
                  {label} <span className="text-slate-400">({unit})</span>
                  <input
                    className={`${INPUT} font-mono`} type="number" min={min} max={max} step={step}
                    value={values[key]}
                    onChange={(event) => {
                      const raw = event.currentTarget.value;
                      updateValue(key, raw === "" ? "" : Number(raw));
                    }}
                    onBlur={(event) => {
                      const number = event.currentTarget.valueAsNumber;
                      if (Number.isFinite(number) && (number < min || number > max)) {
                        updateValue(key, Math.min(max, Math.max(min, number)));
                      }
                    }}
                  />
                </label>
              ))}
            </div>
            <label className={`mt-3 ${LABEL}`}>
              Estado de ánimo
              <select className={INPUT} value={values.mood} onChange={(event) => updateValue("mood", event.currentTarget.value)}>
                <option value="estable">Estable</option>
                <option value="bajo">Bajo</option>
              </select>
            </label>
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-200">
              <input type="checkbox" className="h-4 w-4 accent-cyan-400" checked={values.visual} onChange={(event) => updateValue("visual", event.currentTarget.checked)} />
              Reportar cambio visual
            </label>
          </section>

          <section className={PANEL}>
            <h2 className="text-lg font-semibold">Imagen de demostración</h2>
            <label className={`mt-3 ${LABEL}`}>
              <Upload className="mr-1 inline text-cyan-300" size={15} aria-hidden="true" />
              Cargar ultrasonido o escaneo ocular
              <input type="file" accept="image/png,image/jpeg,image/webp" className={`${INPUT} file:mr-2 file:border-0 file:bg-transparent file:text-cyan-200`} onChange={openImage} />
            </label>
            {imageError && <p role="alert" className="mt-2 text-xs text-rose-300">{imageError}</p>}
            {image && (
              <div className="mt-3">
                <img src={image.url} alt={`Vista previa de ${image.name}`} className="max-h-44 w-full rounded-lg bg-black/30 object-contain" onError={() => {
                  setImage(null);
                  setImageError("El navegador no pudo abrir el archivo como imagen.");
                }} />
                <label className={`mt-3 ${LABEL}`}>
                  Nota para revisión
                  <textarea className={INPUT} rows={2} value={note} maxLength={300} onChange={(event) => setNote(event.currentTarget.value)} />
                </label>
                <button type="button" className={`mt-2 w-full ${BUTTON}`} onClick={() => {
                  const record = { name: image.name, note: note.trim(), time: new Date().toISOString() };
                  setState((current) => ({ ...current, imageRecord: record }));
                }}>Registrar para revisión</button>
              </div>
            )}
            {imageRecord && <p className="mt-3 break-words text-xs text-cyan-200" role="status">Registrada para revisión · {imageRecord.name}</p>}
          </section>
        </aside>

        <div className="grid min-w-0 gap-5">
          <BodyMap statuses={statuses} selected={selected} onSelect={setSelected} />
          <section className={PANEL} aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-semibold"><SystemIcon size={19} className="text-cyan-300" aria-hidden="true" /> {activeSystem.name}</h2>
              <Badge level={statuses[selected]} />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{activeSystem.detail}</p>
            {selectedAlert && <p className="mt-2 text-sm text-amber-200">{selectedAlert.title}</p>}
            {missingSystems[selected] && <p className="mt-2 text-sm text-amber-200">Faltan lecturas de este sistema.</p>}
          </section>
          <TrendChart history={historyFor(state.scenario, values)} metric={metric} onMetric={setMetric} />
        </div>

        <aside className="grid min-w-0 gap-5" aria-label="Revisión y contramedidas">
          <section className={PANEL} aria-labelledby="triage-title">
            <h2 id="triage-title" className="flex items-center gap-2 text-lg font-semibold">
              <ShieldAlert size={20} className="text-cyan-300" aria-hidden="true" /> Triaje de simulación
            </h2>
            <p className="mt-1 text-xs text-slate-300">Reglas de demostración frente a una referencia sintética.</p>
            {missing.length > 0 && <p className="mt-3 text-xs text-amber-200" role="status">Sin datos: {missing.map((field) => field.label).join(", ")}.</p>}
            <div aria-live="polite" className="mt-4 space-y-3">
              {alerts.length === 0 && <p className="flex gap-2 text-sm text-emerald-300"><CheckCircle2 size={18} aria-hidden="true" /> {missing.length ? "Lecturas disponibles sin cambios destacados." : "Lecturas dentro de la referencia simulada."}</p>}
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
            {guideButton}
          </section>

          <section className={PANEL}>
            <h2 className="flex items-center gap-2 text-lg font-semibold"><CheckCircle2 size={20} className="text-cyan-300" aria-hidden="true" /> Rutinas diarias</h2>
            <div className="mt-3 grid gap-2">
              {TASKS.map(([key, title]) => (
                <label key={key} className="flex items-center gap-2 rounded-lg bg-[#091221] p-2.5 text-sm text-slate-200">
                  <input type="checkbox" className="h-4 w-4 shrink-0 accent-cyan-400" checked={checked.includes(key)} onChange={() => markTask(key)} />
                  {title}
                </label>
              ))}
            </div>
          </section>

          <section className={PANEL}>
            <h2 className="text-lg font-semibold">Reportes de misión</h2>
            <button type="button" className={`mt-3 w-full ${BUTTON}`} onClick={saveReport}>Registrar reporte</button>
            <div aria-live="polite" className="mt-3 space-y-2 text-xs text-slate-300">
              <p>{pendingCount} pendientes · {state.reports.length - pendingCount} recibidos en control simulado</p>
              {latest && (
                <details className="rounded-lg border border-slate-800 px-3 py-2.5">
                  <summary className="cursor-pointer text-slate-100">Último reporte · {latest.status === "pending" ? "Pendiente" : "Recibido en simulación"}</summary>
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
                    <div className="col-span-2">
                      <dt>{new Date(latest.created).toLocaleString("es")}</dt>
                      <dd>{MISSIONS[latest.mission]?.name} · {SCENARIOS[latest.scenario]?.title}</dd>
                    </div>
                    {FIELDS.map(({ key, label, unit }) => (
                      <div key={key}>
                        <dt>{label}</dt>
                        <dd className="text-slate-100">{latest.values[key] === "" ? "Sin datos" : `${latest.values[key]} ${unit}`}</dd>
                      </div>
                    ))}
                    {latest.findings.length > 0 && <div className="col-span-2"><dt>Avisos</dt><dd>{latest.findings.join(" · ")}</dd></div>}
                    {latest.image && <div className="col-span-2 break-words"><dt>Imagen registrada</dt><dd>{latest.image.name} {latest.image.note && `· ${latest.image.note}`}</dd></div>}
                  </dl>
                </details>
              )}
            </div>
          </section>
        </aside>
      </main>
      <Guide dialogRef={guide} />
    </div>
  );
}

const BODY_SYSTEMS = {
  neuro: {
    label: "Neurológico y visual",
    short: "Neurovisual",
    Icon: Brain,
    x: 140,
    y: 43,
  },
  cardio: {
    label: "Cardiovascular",
    short: "Cardiovascular",
    Icon: Heart,
    x: 156,
    y: 123,
  },
  bone: {
    label: "Musculoesquelético",
    short: "Músculo y hueso",
    Icon: Bone,
    x: 124,
    y: 228,
  },
  resp: {
    label: "Inmune y respiratorio",
    short: "Respiratorio",
    Icon: Wind,
    x: 116,
    y: 105,
  },
};

const BODY_STATES = {
  ok: { label: "Óptimo", color: "#34d399", text: "text-emerald-300" },
  warn: { label: "Precaución", color: "#fbbf24", text: "text-amber-300" },
  critical: { label: "Crítico", color: "#fb7185", text: "text-rose-300" },
};

function BodyMap({ statuses, selected, onSelect }) {
  const svgId = React.useId();

  return (
    <section className="min-w-0 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-semibold text-slate-100">Mapa de salud</h2>
        <span className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-400">Simulación</span>
      </div>
      <div className="mt-3 grid overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
        <svg
          viewBox="0 0 280 332"
          role="group"
          aria-label="Silueta humana con cuatro sistemas seleccionables"
          className="mx-auto h-[278px] w-full max-w-[290px]"
        >
          <defs>
            <pattern id={`${svgId}-grid`} width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M20 0H0V20" fill="none" stroke="#1e293b" strokeWidth="1" />
            </pattern>
            <linearGradient id={`${svgId}-body`} x2="0" y2="1">
              <stop offset="0%" stopColor="#155e75" stopOpacity=".48" />
              <stop offset="100%" stopColor="#164e63" stopOpacity=".14" />
            </linearGradient>
          </defs>
          <rect x="14" y="10" width="252" height="308" fill={`url(#${svgId}-grid)`} />
          <g fill="none" stroke="#164e63" strokeWidth="1" aria-hidden="true">
            <path d="M140 11v310M31 167h218" strokeDasharray="3 6" />
            <circle cx="140" cy="146" r="88" strokeDasharray="4 8" />
            <circle cx="140" cy="146" r="108" strokeDasharray="2 12" />
            <path d="M16 37V15h22M242 15h22v22M16 290v22h22M242 312h22v-22" />
          </g>
          <g
            fill={`url(#${svgId}-body)`}
            stroke="#4ca6b8"
            strokeWidth="1.6"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M140 18c-16 0-26 13-26 30 0 13 7 24 16 29l-1 9-22 5c-11 3-17 11-21 22l-9 35-16 44-8 14c-2 4 0 8 4 8l9-8 4 2c3 2 7 0 7-4l1-11 17-34 13-36 5 38-4 45 6 36 3 51-5 13c-2 4 1 8 6 8h13c4 0 7-3 7-7l2-42 2-32 4-43h2l4 43 2 32 2 42c0 4 3 7 7 7h13c5 0 8-4 6-8l-5-13 3-51 6-36-4-45 5-38 13 36 17 34 1 11c0 4 4 6 7 4l4-2 9 8c4 0 6-4 4-8l-8-14-16-44-9-35c-4-11-10-19-21-22l-22-5-1-9c9-5 16-16 16-29 0-17-10-30-26-30Z" transform="translate(-3 0)" />
            <path d="M137 76v102m-28-82 28 13 28-13m-47 68 19 11 18-11m-31 32-1 47 2 48m26-95 2 47-2 48" fill="none" opacity=".3" />
          </g>
          {Object.entries(BODY_SYSTEMS).map(([key, system]) => {
            const state = BODY_STATES[statuses[key]] ?? BODY_STATES.ok;
            const active = key === selected;
            return (
              <g
                key={key}
                role="button"
                tabIndex={0}
                aria-label={`${system.label}, ${state.label}`}
                aria-pressed={active}
                onClick={() => onSelect(key)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(key);
                  }
                }}
                transform={`translate(${system.x} ${system.y})`}
                className="group cursor-pointer outline-none transition-opacity hover:opacity-85"
              >
                <circle r="21" fill="transparent" />
                <circle r="17" fill={state.color} opacity={active ? ".20" : ".10"} />
                <circle r="13" fill="none" stroke={state.color} strokeWidth={active ? 2 : 1} opacity=".8" />
                <circle r="20" fill="none" stroke="#fff" strokeWidth="2" className="opacity-0 group-focus-visible:opacity-100" />
                <circle r={active ? 6 : 4.5} fill={state.color} />
              </g>
            );
          })}
        </svg>
        <div className="flex flex-col justify-center gap-2 border-t border-slate-800 p-3 sm:border-l sm:border-t-0">
          {Object.entries(BODY_SYSTEMS).map(([key, { short, Icon }]) => {
            const state = BODY_STATES[statuses[key]] ?? BODY_STATES.ok;
            const active = selected === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelect(key)}
                aria-pressed={active}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${active ? "border-cyan-700 bg-cyan-950/70 text-cyan-100" : "border-slate-800 text-slate-300 hover:border-slate-600"}`}
              >
                <Icon aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 ${state.text}`} />
                <span className="min-w-0 flex-1">{short}</span>
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: state.color }} aria-label={state.label} />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const ASTRIA_TRENDS = {
  radiation: { label: "Radiación", unit: "mSv", color: "#c084fc", fullLabel: "Radiación acumulada" },
  sleep: { label: "Sueño", unit: "h", color: "#22d3ee", fullLabel: "Horas de sueño" },
  bone: { label: "Densidad ósea", unit: "%", color: "#fbbf24", fullLabel: "Densidad ósea simulada" },
};

function TrendChart({ history, metric, onMetric }) {
  const gradientId = React.useId();
  const current = ASTRIA_TRENDS[metric] ?? ASTRIA_TRENDS.sleep;
  const number = new Intl.NumberFormat("es", { maximumFractionDigits: 1 });

  return (
    <section className="min-w-0 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-slate-100">Tendencias</h2>
        <span className="text-xs text-slate-400">Últimos 7 días</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Indicador de la gráfica">
        {Object.entries(ASTRIA_TRENDS).map(([key, option]) => (
          <button
            key={key}
            type="button"
            onClick={() => onMetric(key)}
            aria-pressed={metric === key}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${metric === key ? "border-cyan-700 bg-cyan-950 text-cyan-100" : "border-slate-800 text-slate-300 hover:border-slate-600"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="mb-2 mt-3 text-xs text-slate-400">{current.fullLabel} ({current.unit})</p>
      <div
        role="img"
        aria-label={`${current.fullLabel}, últimos 7 días. ${history.map((entry) => `${entry.day}, ${(entry[metric] === null ? "sin datos" : number.format(entry[metric]))}${entry[metric] === null ? "" : " " + current.unit}`).join("; ")}`}
        className="h-40 min-w-0"
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} debounce={50}>
          <AreaChart data={history} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={current.color} stopOpacity=".35" />
                <stop offset="100%" stopColor={current.color} stopOpacity=".02" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#233047" strokeDasharray="3 5" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={10} />
            <YAxis
              width={36}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => number.format(value)}
              domain={metric === "bone" ? ["auto", "auto"] : [0, "auto"]}
            />
            <Tooltip
              formatter={(value) => [`${number.format(value)} ${current.unit}`, current.fullLabel]}
              contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 10, fontSize: 12 }}
              labelStyle={{ color: "#e2e8f0" }}
              itemStyle={{ color: current.color }}
            />
            <Area dataKey={metric} type="monotone" stroke={current.color} strokeWidth={2} fill={`url(#${gradientId})`} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
