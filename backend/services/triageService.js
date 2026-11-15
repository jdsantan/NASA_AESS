import { BASELINE } from "../config/baseline.js";

export function evaluateTriage(values, scenario, checked = []) {
  const alerts = [];
  const add = (group, level, title, steps) => alerts.push({ group, level, title, steps });
  const num = (f) => (values[f] === "" || values[f] == null ? null : Number(values[f]));

  const oxygen = num("oxygen");
  const radiation = num("radiation");
  const sleep = num("sleep");
  const heart = num("heart");
  const systolic = num("systolic");
  const diastolic = num("diastolic");
  const glucose = num("glucose");
  const temperature = num("temperature");

  if (oxygen !== null && (oxygen < 19.5 || oxygen - BASELINE.oxygen >= 2)) {
    add("resp", "critical", "Alerta de O₂ en cabina · Pre-EVA (Fuente: NASA HERA Environmental Standards)", [
      "ACCIÓN INMEDIATA: Suspender preparación de caminata espacial (EVA) y activar suministro de O₂ suplementario.",
      "Verificar sellos de presión del compartimento y calibración de los 14 gases ambientales del hábitat.",
      "CRITERIO DE ESCALADO: Enviar paquete de telemetría prioritario al Cirujano de Vuelo e Ingeniero de Soporte Vital en Tierra.",
    ]);
  }
  if (radiation !== null && radiation - BASELINE.radiation >= 10) {
    add("resp", "critical", "Pico de Radiación SPE/CME (Fuente: NASA SRAG / CSA CANS Dosimetry)", [
      "ACCIÓN INMEDIATA: Cancelar toda actividad extravehicular (EVA) y trasladarse al refugio de tormentas de la nave (zona blindada con agua y bloques de polietileno RFX1 ricos en hidrógeno para frenar neutrones secundarios).",
      "Verificar lectura del dosímetro personal y del espectrómetro autónomo de neutrones (CANS).",
      "Ingerir contramedidas dietéticas antioxidantes (vitaminas C y A, pectina y omega-3) para mitigar daño al ADN por radicales libres.",
      "CRITERIO DE ESCALADO: Escalar reporte asíncrono al Cirujano de Vuelo si la dosis a 30 días se acerca al límite de 250 mSv para órganos hematopoyéticos.",
    ]);
  }
  if (values.visual) {
    add("neuro", "warn", "Síndrome Neuro-Ocular / Desplazamiento de Fluidos (Fuente: NASA Fluid Shifts Study)", [
      "Programar sesión con el traje ruso de presión negativa para la parte inferior del cuerpo (Chibis / LBNP) para revertir el flujo de líquidos hacia las piernas.",
      "Realizar medición no invasiva de presión intracraneal mediante ondas acústicas en el oído interno (dispositivo CCFP / DPOAE) y escaneo ocular con cámara OCT portátil.",
      "CRITERIO DE ESCALADO: Adjuntar imagen de ultrasonido ocular en el panel izquierdo y enviar al Cirujano de Vuelo para evaluación diferida.",
    ]);
  }
  if ((sleep !== null && BASELINE.sleep - sleep >= 1.5) || ["bajo", "fatiga", "estrés"].includes(values.mood)) {
    add("neuro", "warn", "Déficit de Sueño y Aislamiento (Fuente: NASA Ames Actigraphy / HERA Study)", [
      "Iniciar sesión de fototerapia LED para realinear el ritmo circadiano (nota científica: recuperar una desregulación circadiana requiere hasta 13 h de descanso acumulado).",
      "Dedicar 20 minutos al cuidado del cultivo espacial (sistema botánico Veggie / mostaza mizuna) para estimulación sensorial y mejora del estado de ánimo.",
      "Registrar pensamientos en el diario personal de la misión para liberar frustración y prevenir fallos de comunicación en el equipo.",
    ]);
  }
  if (
    (heart !== null && Math.abs(heart - BASELINE.heart) >= 14) ||
    (systolic !== null && Math.abs(systolic - BASELINE.systolic) >= 18) ||
    (diastolic !== null && Math.abs(diastolic - BASELINE.diastolic) >= 12) ||
    (systolic !== null && diastolic !== null && diastolic >= systolic)
  ) {
    add("cardio", "warn", "Anomalía Cardiovascular / Riesgo Ortostático (Fuente: NASA HRP Cardiovascular)", [
      "Guardar reposo, hidratarse (meta: 2.5 L diarios) y repetir la medición con el manguito de presión tras 5 minutos.",
      "Si ocurre tras transición gravitatoria (aterrizaje en Marte 3/8g o Luna 1/6g), evitar cambios bruscos de postura y usar prendas de compresión.",
      "CRITERIO DE ESCALADO: Si persiste en segunda lectura o se acompaña de dolor torácico, activar protocolo de emergencia a bordo y transmitir alerta roja a Tierra.",
    ]);
  }
  if (
    (glucose !== null && Math.abs(glucose - BASELINE.glucose) >= 25) ||
    (temperature !== null && Math.abs(temperature - BASELINE.temperature) >= 1)
  ) {
    add("resp", "warn", "Alteración Metabólica o Inmunológica (Fuente: NASA Spaceflight Immunology)", [
      "La microgravedad induce resistencia a la insulina y el estrés altera las citoquinas, pudiendo reactivar virus latentes.",
      "Confirmar temperatura corporal, reforzar hidratación y registrar muestra de saliva/orina en bitácora médica.",
    ]);
  }
  if (scenario === "fatigue" && !checked.includes("exercise")) {
    add("bone", "warn", "Riesgo de Pérdida Ósea y Cálculos Renales (Fuente: NASA ARGOS / Wake Forest Study)", [
      "Completar 1.5 h de ejercicio resistivo antigravedad para mitigar la pérdida del 1% al 1.5% mensual de masa ósea en columna y fémur.",
      "Asegurar ingesta de suplemento de Vitamina D (inhibida por el blindaje UV de la nave) y abundante agua para evitar cálculos renales por exceso de calcio.",
    ]);
  }

  return alerts.sort((a, b) => Number(b.level === "critical") - Number(a.level === "critical"));
}
