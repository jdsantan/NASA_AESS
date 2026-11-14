import React from "react";
import { X } from "lucide-react";
import { BUTTON } from "../data/astriaConfig";

export default function GuideModal({ dialogRef }) {
  return (
    <dialog ref={dialogRef} aria-labelledby="guide-title" className="m-auto w-[min(94vw,32rem)] rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl backdrop:bg-slate-900/50">
      <div className="flex items-center justify-between gap-4">
        <h2 id="guide-title" className="text-xl font-bold text-slate-900">Guía de autoexamen</h2>
        <form method="dialog">
          <button aria-label="Cerrar guía" className={BUTTON}><X size={18} aria-hidden="true" /></button>
        </form>
      </div>
      <div className="mt-5 space-y-5 text-sm leading-relaxed text-slate-600">
        <section>
          <h3 className="mb-1 font-semibold text-blue-700">Dosímetro personal</h3>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Verifica que el identificador corresponda al tripulante y sigue la ficha del dispositivo de la misión.</li>
            <li>Registra valor, unidad, periodo de acumulación y hora de lectura.</li>
            <li>Marca la lectura para revisión si falta la unidad o el dispositivo informa un fallo.</li>
          </ol>
        </section>
        <section>
          <h3 className="mb-1 font-semibold text-blue-700">Registro de ultrasonido o imagen ocular</h3>
          <p>Usa la guía oficial del equipo con la persona autorizada a bordo. Adjunta únicamente una imagen de demostración. Ingresa la fecha y el contexto en la nota de revisión.</p>
        </section>
      </div>
    </dialog>
  );
}