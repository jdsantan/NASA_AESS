import React from "react";
import { Upload } from "lucide-react";
import { BUTTON, INPUT, LABEL, PANEL, SCENARIOS } from "../data/astriaConfig.js";
import IndicatorsCard from "./IndicatorsCard.jsx";

export default function AcquisitionSidebar({
  scenario, values, live, lastSample, image, imageError, note, imageRecord,
  onChooseScenario, onToggleLive, onUpdateValue, onOpenImage, onImageLoadError, onChangeNote, onSaveImageRecord,
}) {
  return (
    <aside className="grid min-w-0 gap-5" aria-label="Adquisición de datos">
      <details className={PANEL}>
        <summary className="cursor-pointer rounded font-semibold text-blue-800 focus-visible:outline-2 focus-visible:outline-offset-4">Simulador de escenarios (Demo)</summary>
        <div className="mt-3 grid gap-1.5" role="group" aria-label="Escenarios de demostración">
          {Object.entries(SCENARIOS).map(([key, item]) => (
            <button
              key={key}
              type="button"
              aria-pressed={scenario === key}
              className={`${BUTTON} text-left aria-pressed:border-blue-600 aria-pressed:bg-blue-50 aria-pressed:text-blue-800`}
              onClick={() => onChooseScenario(key)}
            >
              {item.title}
            </button>
          ))}
        </div>
      </details>

      <IndicatorsCard
        values={values} live={live} lastSample={lastSample}
        onToggleLive={onToggleLive} onUpdateValue={onUpdateValue}
      />
      <details className={PANEL}>
        <summary className="cursor-pointer rounded font-semibold text-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2">Imagen de demostración</summary>
        <label className={`mt-3 ${LABEL}`}>
          <Upload className="mr-1 inline text-blue-600" size={15} aria-hidden="true" />
          Cargar ultrasonido o escaneo ocular
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className={`${INPUT} file:mr-2 file:border-0 file:bg-transparent file:font-semibold file:text-blue-700`}
            onChange={onOpenImage}
          />
        </label>
        {imageError && <p role="alert" className="mt-2 text-xs font-medium text-rose-600">{imageError}</p>}
        {image && (
          <div className="mt-3">
            <img
              src={image.url}
              alt={`Vista previa de ${image.name}`}
              className="max-h-44 w-full rounded-md border border-slate-900/10 bg-slate-100 object-contain"
              onError={onImageLoadError}
            />
            <label className={`mt-3 ${LABEL}`}>
              Nota para revisión
              <textarea className={INPUT} rows={2} value={note} maxLength={300} onChange={(e) => onChangeNote(e.currentTarget.value)} />
            </label>
            <button type="button" className={`mt-2 w-full ${BUTTON}`} onClick={onSaveImageRecord}>
              Registrar para revisión
            </button>
          </div>
        )}
        {imageRecord && <p className="mt-3 break-words text-xs font-semibold text-blue-700" role="status">Registrada para revisión · {imageRecord.name}</p>}
      </details>
    </aside>
  );
}