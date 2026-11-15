import { Bone, Brain, Heart, Wind } from "lucide-react";

export const STORAGE = "astria-monitor-v1";
export const PANEL = "rounded-lg border border-slate-900/15 bg-white p-4 text-slate-900 shadow-[0_1px_0_rgb(15_23_42/0.04)] sm:p-5";
export const LABEL = "block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500";
export const INPUT = "mt-1.5 w-full rounded-md border border-slate-900/20 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-900 outline-none transition hover:border-slate-900/35 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";
export const BUTTON = "rounded-md border border-slate-900/20 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:border-blue-600 hover:bg-blue-50 hover:text-blue-800 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:pointer-events-none disabled:opacity-50";
export const MISSIONS = {
  iss: { name: "Estación Espacial · ISS", delay: 0, latency: "0 s (redondeado)", gravity: "≈ 0 g" },
  transit: { name: "Nave en tránsito", delay: 720, latency: "12 min", gravity: "≈ 0 g" },
  moon: { name: "Base lunar · Artemis", delay: 1.3, latency: "1,3 s", gravity: "1/6 g" },
  mars: { name: "Base marciana", delay: 1200, latency: "20 min · 40 min ida/vuelta", gravity: "3/8 g" },
};

export const CABIN_OXYGEN_REFERENCE = 19.5;

export const BASELINE = {
  heart: 68, systolic: 116, diastolic: 75, glucose: 92, temperature: 36.7,
  sleep: 7.8, radiation: 7, oxygen: 20.9, mood: "estable", visual: false,
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

export const INSTRUMENT_PANEL = "rounded-lg border border-slate-900/15 bg-white text-slate-900 shadow-[0_1px_0_rgb(15_23_42/0.04)]";
export const READOUT_TILE = "min-w-0 rounded-md border border-slate-900/10 bg-slate-50";
export const READOUT_VALUE = "font-mono font-semibold tabular-nums tracking-tight text-slate-950";
export const PRIMARY_BUTTON = "inline-flex items-center rounded-md border border-blue-700 bg-blue-600 px-4 py-2 text-sm font-semibold text-slate-50 transition hover:bg-blue-700 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";
export const INSTRUMENT_LABEL = "text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500";

export const STATUS_SIGNAL = {
  ok: { marker: "bg-emerald-500", ruleTop: "border-t-emerald-500", ruleLeft: "border-l-emerald-500", text: "text-emerald-700", tint: "bg-white" },
  warn: { marker: "bg-amber-500", ruleTop: "border-t-amber-500", ruleLeft: "border-l-amber-500", text: "text-amber-800", tint: "bg-amber-50" },
  critical: { marker: "bg-rose-500", ruleTop: "border-t-rose-500", ruleLeft: "border-l-rose-500", text: "text-rose-700", tint: "bg-rose-50" },
};
