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

  if (oxygen !== null && Math.abs(oxygen - BASELINE.oxygen) >= 2) {
    add("resp", "critical", "Evento de oxígeno de cabina", [
      "Comprueba la unidad, el sensor de cabina y la hora de la lectura.",
      "Avisa al responsable de operaciones. Consulta la lista de contingencia aprobada.",
    ]);
  }
  if (radiation !== null && radiation - BASELINE.radiation >= 10) {
    add("resp", "critical", "Aumento de dosis registrada", [
      "Verifica el dosímetro, el intervalo de lectura y el contexto de la misión.",
      "Comunica el evento a control de misión y consulta el procedimiento vigente.",
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
      "Confirma el registro de sueño y anota los cambios de turno y fatiga.",
      "Revisa la rutina de descanso acordada con la misión.",
    ]);
  }
  if (
    (heart !== null && Math.abs(heart - BASELINE.heart) >= 14) ||
    (systolic !== null && Math.abs(systolic - BASELINE.systolic) >= 18) ||
    (diastolic !== null && Math.abs(diastolic - BASELINE.diastolic) >= 12) ||
    (systolic !== null && diastolic !== null && diastolic >= systolic)
  ) {
    add("cardio", "warn", "Cambio cardiovascular registrado", [
      "Comprueba la calidad de la señal y repite la medición.",
      "Guarda ambas lecturas y deriva el caso al responsable médico si persiste.",
    ]);
  }
  if (
    (glucose !== null && Math.abs(glucose - BASELINE.glucose) >= 25) ||
    (temperature !== null && Math.abs(temperature - BASELINE.temperature) >= 1)
  ) {
    add("resp", "warn", "Cambio de glucosa o temperatura", [
      "Confirma la unidad y registra el contexto de la medición.",
      "Comparte el registro con el responsable médico para su revisión.",
    ]);
  }
  if (scenario === "fatigue" && !checked.includes("exercise")) {
    add("bone", "warn", "Rutina de ejercicio pendiente", [
      "Consulta la rutina programada y registra si quedó completada o reprogramada.",
    ]);
  }

  return alerts.sort((a, b) => Number(b.level === "critical") - Number(a.level === "critical"));
}
