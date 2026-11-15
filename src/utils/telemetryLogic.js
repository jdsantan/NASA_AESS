import { BASELINE, CABIN_OXYGEN_REFERENCE, MISSIONS, SCENARIOS, STORAGE } from "../data/astriaConfig.js";

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

export const stripCitation = (text) => text.replace(/\s*\[cite:[^\]]*\]|\s*``/gi, "");

export function assess(values, scenario, checked) {
  const alerts = [];
  const add = (group, level, title, steps, fields) =>
    alerts.push({ group, level, title: stripCitation(title), steps: steps.map(stripCitation), fields });
  const number = (field) => values[field] === "" || values[field] == null ? null : Number(values[field]);
  const oxygen = number("oxygen");
  const radiation = number("radiation");
  const sleep = number("sleep");
  const heart = number("heart");
  const bloodPressure = number("systolic");
  const diastolic = number("diastolic");
  const glucose = number("glucose");
  const temperature = number("temperature");

  if (oxygen !== null && (oxygen < CABIN_OXYGEN_REFERENCE || oxygen >= BASELINE.oxygen + 2)) {
    add("resp", "critical", "Alerta de O₂ en cabina · Pre-EVA", [
      "ACCIÓN INMEDIATA: Suspender preparación de caminata espacial (EVA) y activar suministro de O₂ suplementario.",
      "Verificar sellos de presión del compartimento y calibración de los 14 gases ambientales del hábitat[cite: 154].",
      "CRITERIO DE ESCALADO: Enviar paquete de telemetría prioritario al Cirujano de Vuelo e Ingeniero de Soporte Vital en Tierra[cite: 4, 207].",
    ], ["oxygen"]);
  }
  if (radiation !== null && radiation - BASELINE.radiation >= 10) {
    add("resp", "critical", "Pico de Radiación SPE/CME", [
      "ACCIÓN INMEDIATA: Cancelar toda actividad extravehicular (EVA) y trasladarse al refugio de tormentas de la nave (zona blindada con agua y bloques de polietileno RFX1 ricos en hidrógeno para frenar neutrones secundarios)[cite: 28, 61, 62, 117].",
      "Verificar lectura del dosímetro personal y del espectrómetro autónomo de neutrones (CANS)[cite: 8, 60].",
      "Ingerir contramedidas dietéticas antioxidantes (vitaminas C y A, pectina y omega-3) para mitigar daño al ADN por radicales libres[cite: 63].",
      "CRITERIO DE ESCALADO: Escalar reporte asíncrono al Cirujano de Vuelo si la dosis a 30 días se acerca al límite de 250 mSv para órganos hematopoyéticos[cite: 31, 207].",
    ], ["radiation"]);
  }
  if (values.visual) {
    add("neuro", "warn", "Síndrome Neuro-Ocular / Desplazamiento de Fluidos", [
      "Programar sesión con el traje ruso de presión negativa para la parte inferior del cuerpo (Chibis / LBNP) para revertir el flujo de líquidos hacia las piernas[cite: 150, 151].",
      "Realizar medición no invasiva de presión intracraneal mediante ondas acústicas en el oído interno (dispositivo CCFP / DPOAE) y escaneo ocular con cámara OCT portátil[cite: 151, 152].",
      "CRITERIO DE ESCALADO: Adjuntar imagen de ultrasonido ocular en el panel izquierdo y enviar al Cirujano de Vuelo para evaluación diferida[cite: 3, 138, 207].",
    ], ["visual"]);
  }
  const moodChanged = ["bajo", "fatiga", "estrés"].includes(values.mood);
  if ((sleep !== null && BASELINE.sleep - sleep >= 1.5) || moodChanged) {
    add("neuro", "warn", "Déficit de Sueño y Aislamiento", [
      "Iniciar sesión de fototerapia LED para realinear el ritmo circadiano (nota científica: recuperar una desregulación circadiana requiere hasta 13 h de descanso acumulado)[cite: 121, 132].",
      "Dedicar 20 minutos al cuidado del cultivo espacial (sistema botánico Veggie / mostaza mizuna) para estimulación sensorial y mejora del estado de ánimo[cite: 126, 127].",
      "Registrar pensamientos en el diario personal de la misión para liberar frustración y prevenir fallos de comunicación en el equipo[cite: 125, 126].",
    ], [sleep !== null && BASELINE.sleep - sleep >= 1.5 && "sleep", moodChanged && "mood"].filter(Boolean));
  }
  const invertedPressure = bloodPressure !== null && diastolic !== null && diastolic >= bloodPressure;
  const cardioFields = [
    heart !== null && Math.abs(heart - BASELINE.heart) >= 14 && "heart",
    (invertedPressure || (bloodPressure !== null && Math.abs(bloodPressure - BASELINE.systolic) >= 18)) && "systolic",
    (invertedPressure || (diastolic !== null && Math.abs(diastolic - BASELINE.diastolic) >= 12)) && "diastolic",
  ].filter(Boolean);
  if (cardioFields.length) {
    add("cardio", "warn", "Anomalía Cardiovascular / Riesgo Ortostático", [
      "Guardar reposo, hidratarse (meta: 2.5 L diarios) y repetir la medición con el manguito de presión tras 5 minutos.",
      "Si ocurre tras transición gravitatoria (aterrizaje en Marte 3/8g o Luna 1/6g), evitar cambios bruscos de postura y usar prendas de compresión[cite: 142, 146].",
      "CRITERIO DE ESCALADO: Si persiste en segunda lectura o se acompaña de dolor torácico, activar protocolo de emergencia a bordo y transmitir alerta roja a Tierra[cite: 207].",
    ], cardioFields);
  }
  const metabolicFields = [
    glucose !== null && Math.abs(glucose - BASELINE.glucose) >= 25 && "glucose",
    temperature !== null && Math.abs(temperature - BASELINE.temperature) >= 1 && "temperature",
  ].filter(Boolean);
  if (metabolicFields.length) {
    add("resp", "warn", "Alteración Metabólica o Inmunológica", [
      "La microgravedad induce resistencia a la insulina y el estrés altera las citoquinas, pudiendo reactivar virus latentes[cite: 10, 155, 156].",
      "Confirmar temperatura corporal, reforzar hidratación y registrar muestra de saliva/orina en bitácora médica[cite: 156].",
    ], metabolicFields);
  }
  if (scenario === "fatigue" && !checked.includes("exercise")) {
    add("bone", "warn", "Riesgo de Pérdida Ósea y Cálculos Renales", [
      "Completar 1.5 h de ejercicio resistivo antigravedad para mitigar la pérdida del 1% al 1.5% mensual de masa ósea en columna y fémur[cite: 140, 143, 148].",
      "Asegurar ingesta de suplemento de Vitamina D (inhibida por el blindaje UV de la nave) y abundante agua para evitar cálculos renales por exceso de calcio[cite: 65, 140].",
    ], ["exercise"]);
  }
  return alerts.sort((a, b) => Number(b.level === "critical") - Number(a.level === "critical"));
}
