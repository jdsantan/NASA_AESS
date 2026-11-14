import { BASELINE, MISSIONS, SCENARIOS, STORAGE } from "../data/astriaConfig.js";

export function dateKey(date = new Date()) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(
    (part) => String(part).padStart(2, "0"),
  ).join("-");
}

export function shiftDate(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function initialState() {
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
      reports: Array.isArray(saved.reports) ? saved.reports.map((report) =>
        report.status === "delivered" && !report.syncedAt ? { ...report, status: "local" } : report
      ) : [],
    };
  } catch {
    return defaults;
  }
}

export function assess(values, scenario, checked) {
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

export function historyFor(scenario, values) {
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
