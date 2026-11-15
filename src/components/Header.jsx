import React from "react";
import { Activity, Award, Clock, Radio } from "lucide-react";
import { BUTTON, INPUT, LABEL, MISSIONS } from "../data/astriaConfig";

export default function Header({
  state, mission, readiness, checkedCount, assignedCount, streak, apiOnline, storageError, onToggleLink, onChangeMission, showReadiness, publicSite,
}) {
  return (
    <header className="border-b border-slate-200 bg-white shadow-2xs">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-2.5 text-blue-600">
              <Activity size={27} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">ASTRIA</h1>
              <p className="mt-1 text-sm font-medium text-slate-600">Centro de seguimiento de misión</p>
            </div>
          </div>
          {!publicSite && <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={BUTTON} onClick={onToggleLink}>
              <Radio size={16} aria-hidden="true" className={`mr-2 inline ${state.connection ? "text-emerald-600" : "text-amber-600"}`} />
              {state.connection ? "Simular corte de enlace" : "Restablecer enlace"}
            </button>
          </div>}
        </div>

        <div className={`mt-6 grid gap-4 sm:grid-cols-2 ${showReadiness ? "xl:grid-cols-[1.25fr_1fr_1fr]" : ""}`}>
          <label className={LABEL}>
            Entorno de misión
            <select className={INPUT} value={state.mission} onChange={(e) => onChangeMission(e.currentTarget.value)}>
              {Object.entries(MISSIONS).map(([key, item]) => (
                <option key={key} value={key}>{item.name}</option>
              ))}
            </select>
          </label>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Clock size={14} aria-hidden="true" className="text-blue-600" /> Latencia estimada por trayecto
            </p>
            <p className="mt-1 font-mono text-sm font-semibold text-blue-700">
              {mission.latency} <span className="ml-2 text-slate-600">{mission.gravity}</span>
            </p>
          </div>

          {showReadiness && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:col-span-2 xl:col-span-1">
              <div className="flex justify-between gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <span className="flex items-center gap-2"><Award size={15} aria-hidden="true" className="text-blue-600" /> Preparación de misión</span>
                <b className="font-mono text-blue-700">{readiness}%</b>
              </div>
              <progress aria-label="Preparación de misión" className="mt-2 block h-2 w-full accent-blue-600" value={readiness} max={100} />
              <p className="mt-1 text-xs text-slate-500">
                {checkedCount}/{assignedCount} rutinas · Racha de {streak} {streak === 1 ? "día" : "días"}
              </p>
            </div>
          )}
        </div>

        <p className="mt-4 text-xs font-medium text-slate-600" role="status">
          Perfiles ficticios · Lecturas de ejemplo
          {publicSite ? <span> · Los cambios se guardan en este navegador</span> : <>
          <span className="sr-only">Estado de conexión</span> <span className="px-2 text-slate-300">·</span>
          {state.connection ? "Enlace disponible" : "Enlace interrumpido"}
          <span className="px-2 text-slate-300">·</span>
          <span className={apiOnline ? "text-emerald-700 font-semibold" : "text-amber-700 font-semibold"}>
            {apiOnline ? "Backend conectado (Puerto 4000)" : "Modo local (Backend desconectado)"}
          </span>
          {(mission.delay > 300 || !state.connection) && (
            <span className="ml-2 font-semibold text-amber-700">· Modo autónomo de triaje activo</span>
          )}</>}
        </p>
        {storageError && <p role="alert" className="mt-2 text-xs text-amber-700">El navegador impide guardar los cambios al recargar.</p>}
      </div>
    </header>
  );
}