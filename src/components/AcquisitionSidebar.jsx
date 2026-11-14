import React from "react";
import { Upload } from "lucide-react";
import { BUTTON, FIELDS, INPUT, LABEL, PANEL, SCENARIOS } from "../data/astriaConfig";

export default function AcquisitionSidebar({
  scenario, values, image, imageError, note, imageRecord,
  onChooseScenario, onUpdateValue, onOpenImage, onImageLoadError, onChangeNote, onSaveImageRecord,
}) {
  return (
    <aside className="grid min-w-0 gap-5" aria-label="Adquisición de datos">
      <section className={PANEL}>
        <h2 className="text-lg font-semibold text-slate-900">Escenario simulado</h2>
        <div className="mt-3 grid gap-1.5" role="group" aria-label="Cargar lecturas de ejemplo">
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
      </section>

      <section className={PANEL}>
        <h2 className="text-lg font-semibold text-slate-900">Indicadores</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {FIELDS.map(({ key, label, unit, min, max, step }) => (
            <label className={LABEL} key={key}>
              {label} <span className="font-normal text-slate-400">({unit})</span>
              <input
                className={`${INPUT} font-mono`}
                type="number" min={min} max={max} step={step}
                value={values[key]}
                onChange={(e) => {
                  const raw = e.currentTarget.value;
                  onUpdateValue(key, raw === "" ? "" : Number(raw));
                }}
                onBlur={(e) => {
                  const num = e.currentTarget.valueAsNumber;
                  if (Number.isFinite(num) && (num < min || num > max)) {
                    onUpdateValue(key, Math.min(max, Math.max(min, num)));
                  }
                }}
              />
            </label>
          ))}
        </div>
        <label className={`mt-3 ${LABEL}`}>
          Estado de ánimo
          <select className={INPUT} value={values.mood} onChange={(e) => onUpdateValue("mood", e.currentTarget.value)}>
            <option value="estable">Estable</option>
            <option value="bajo">Bajo</option>
          </select>
        </label>
        <label className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 accent-blue-600"
            checked={values.visual}
            onChange={(e) => onUpdateValue("visual", e.currentTarget.checked)}
          />
          Reportar cambio visual
        </label>
      </section>

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
              className="max-h-44 w-full rounded-lg border border-slate-200 bg-slate-100 object-contain"
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