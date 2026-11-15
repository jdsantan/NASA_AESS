import { Bone, Brain, Heart, Wind } from "lucide-react";

export const STORAGE = "astria-monitor-v1";
export const PANEL = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 text-slate-900";
export const LABEL = "block text-xs font-semibold uppercase tracking-wider text-slate-500";
export const INPUT = "mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20";
export const BUTTON = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-2xs transition hover:border-blue-600 hover:bg-blue-50/60 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50";
export const MISSIONS = {
  iss: { name: "Estación Espacial · ISS", delay: 0, latency: "0 s (redondeado)", gravity: "≈ 0 g" },
  transit: { name: "Nave en tránsito", delay: 720, latency: "12 min", gravity: "≈ 0 g" },
  moon: { name: "Base lunar · Artemis", delay: 1.3, latency: "1,3 s", gravity: "1/6 g" },
  mars: { name: "Base marciana", delay: 1200, latency: "20 min · 40 min ida/vuelta", gravity: "3/8 g" },
};

export const CABIN_OXYGEN_REFERENCE = 19.5;

export const BASELINE = {
  heart: 68, systolic: 116, diastolic: 75, glucose: 92, temperature: 36.7,
  sleep: 7.8, radiation: 7, oxygen: 21, mood: "estable", visual: false,
};

export const SCENARIOS = {
  nominal: { title: "Estado nominal", values: {}, bone: 99.2 },
  solar: { title: "Tormenta solar", values: { radiation: 24 }, bone: 99.2 },
  sans: { title: "Cambios visuales · SANS simulado", values: { visual: true, heart: 78, systolic: 129 }, bone: 99.0 },
  oxygen: { title: "Evento de O₂ en cabina · pre-EVA", values: { oxygen: 18.2, heart: 98 }, bone: 99.0 },
  fatigue: { title: "Fatiga y aislamiento", values: { sleep: 4.9, mood: "fatiga", heart: 83 }, bone: 98.8 },
};

export const FIELDS = [
  { key: "heart", label: "Pulso en reposo", unit: "lpm", min: 0, max: 300, step: 1 },
  { key: "systolic", label: "Presión sistólica", unit: "mmHg", min: 0, max: 300, step: 1 },
  { key: "diastolic", label: "Presión diastólica", unit: "mmHg", min: 0, max: 300, step: 1 },
  { key: "glucose", label: "Glucosa", unit: "mg/dL", min: 0, max: 1000, step: 1 },
  { key: "temperature", label: "Temperatura corporal", unit: "°C", min: 0, max: 60, step: 0.1 },
  { key: "sleep", label: "Horas de sueño", unit: "h", min: 0, max: 24, step: 0.1 },
  { key: "radiation", label: "Dosis personal acumulada", unit: "mSv", min: 0, max: 5000, step: 0.1 },
  { key: "oxygen", label: "Oxígeno de cabina", unit: "%", min: 0, max: 100, step: 0.1 },
];

export const SYSTEMS = {
  neuro: {
    name: "Sistema nervioso y ojos",
    icon: Brain,
    detail: "En microgravedad, los fluidos suben a la cabeza aumentando la presión intracraneal y alterando la visión (más de 2/3 de astronautas sufren cambios oculares según NASA Fluid Shifts). Además, la desincronización circadiana reduce el sueño a ~6 h promedio (Estudio NASA HERA)."
  },
  cardio: {
    name: "Sistema cardiovascular",
    icon: Heart,
    detail: "El corazón y los vasos sanguíneos se adaptan a la redistribución de fluidos y a las transiciones entre 0g, 1/6g (Luna) y 3/8g (Marte), pudiendo causar mareos ortostáticos o desmayos al aterrizar (NASA HRP)."
  },
  bone: {
    name: "Sistema musculoesquelético",
    icon: Bone,
    detail: "Sin carga gravitatoria, los huesos que soportan peso pierden entre 1% y 1.5% de densidad mineral al mes (NASA HRP / Wake Forest qCT Study), liberando calcio que eleva el riesgo de cálculos renales."
  },
  resp: {
    name: "Sistema inmune y respiratorio",
    icon: Wind,
    detail: "Monitorea gases del hábitat (14 gases simulados en HERA) y radiación ionizante (GCR y tormentas solares SPE/CME). La radiación y el estrés alteran las citoquinas y pueden reactivar virus latentes (NASA Immunology Study)."
  },
};

export const TASKS = [
  ["exercise", "Ejercicio programado de la misión"],
  ["nutrition", "Registro de hidratación y alimentación"],
  ["journal", "Diario emocional o chequeo cognitivo"],
  ["eva", "Revisión de lista previa a EVA"],
];

export const TOOLS = {
  ok: { text: "Óptimo", tone: "border-emerald-500/40 bg-emerald-50 text-emerald-800" },
  warn: { text: "Precaución", tone: "border-amber-500/40 bg-amber-50 text-amber-900" },
  critical: { text: "Crítico", tone: "border-rose-500/40 bg-rose-50 text-rose-800" },
};
