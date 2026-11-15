export const ALERT_PROTOCOLS = {
  "Pico de Radiación SPE/CME": {
    whatHappens: "Tormenta de partículas solares o eyección de masa coronal detectada por dosimetría; riesgo de irradiación aguda y daño celular.",
    immediateAction: "Cancelar toda actividad extravehicular (EVA), trasladar de inmediato a toda la tripulación al refugio blindado de la nave (zona rodeada por tanques de agua/polietileno) y mantener monitoreo continuo de tasa de dosis (mSv/h) hasta que pase el pico.",
  },
  "Alerta de O₂ en cabina · Pre-EVA": {
    whatHappens: "Nivel de oxígeno ambiental por debajo del umbral seguro (19,5 %); riesgo inminente de hipoxia y desorientación.",
    immediateAction: "Suspender preparación de caminata espacial, verificar sellos de escotillas y válvulas del sistema de soporte vital, activar suministro auxiliar de O₂ en cabina y colocarse mascarillas de emergencia si la saturación sigue bajando.",
  },
  "Síndrome Neuro-Ocular / Desplazamiento de Fluidos": {
    whatHappens: "La microgravedad desplaza fluidos corporales hacia la cabeza, aumentando la presión intracraneal y deformando el nervio óptico (SANS).",
    immediateAction: "Realizar ecografía ocular/escaneo de retina, adjuntar la imagen en un reporte para revisión asíncrona de los médicos de vuelo en Tierra y aplicar protocolos de redistribución de fluidos (como pantalones de presión negativa LBNP si están disponibles).",
  },
  "Déficit de Sueño y Aislamiento": {
    whatHappens: "Acumulación de fatiga por alteración del ritmo circadiano y confinamiento prolongado, lo que eleva el riesgo de error operativo.",
    immediateAction: "Reasignar tareas críticas de precisión, aplicar terapia de luz azul/blanca regulada para sincronizar el ciclo circadiano, registrar entrada en el diario emocional privado y programar bloque de descanso protegido de al menos 7 horas.",
  },
  "Anomalía Cardiovascular / Riesgo Ortostático": {
    whatHappens: "Variación en pulso en reposo o presión arterial asociada al desacondicionamiento cardiovascular en gravedad reducida.",
    immediateAction: "Repetir medición de presión arterial tras 5 minutos de reposo, iniciar protocolo de rehidratación oral con electrolitos y evitar cambios bruscos de postura o esfuerzos intensos hasta estabilizar valores.",
  },
  "Riesgo de Pérdida Ósea y Cálculos Renales": {
    whatHappens: "Desmineralización ósea acelerada por falta de carga gravitacional (1 %–1,5 % mensual), liberando calcio que puede formar cálculos renales.",
    immediateAction: "Verificar cumplimiento obligatorio de 1,5 horas diarias de ejercicio resistivo (ARED/cinta), incrementar ingesta hídrica diaria por encima de 2,5 L y revisar suplementación de vitamina D.",
  },
  "Alteración Metabólica o Inmunológica": {
    whatHappens: "La microgravedad induce resistencia a la insulina y el estrés altera las citoquinas, lo que puede reactivar virus latentes.",
    immediateAction: "Repetir la medición de glucosa y temperatura corporal, reforzar hidratación y registrar muestra de saliva/orina en la bitácora médica para revisión diferida.",
  },
};
