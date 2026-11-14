import React from "react";
import { Activity, Award, Clock, Radio } from "lucide-react";
import { BUTTON, INPUT, LABEL, MISSIONS, TASKS } from "../data/astriaConfig.js";

export default function Header({
  state, mission, readiness, checkedCount, streak, apiOnline, storageError, onToggleLink, onChangeMission,
}) {
  return (
    <header className="border-b border-slate-800 bg-[radial-gradient(ellipse_at_top_left,#123044,transparent_65%)]">
      <div className="mx-auto max-w-[1570px] px-4 py-6 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-2.5 text-cyan-300">
              <Activity size={27} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">ASTRIA</h1>
              <p className="mt-1 text-xs font-medium tracking-widest text-slate-300">HRP HEALTH MONITOR</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={BUTTON} onClick={onToggleLink}>
              <Radio size={16} aria-hidden="true" className={`mr-2 inline ${state.connection ? "text-emerald-300" : "text-amber-300"}`} />
              {state.connection ? "Simular corte de enlace" : "Restablecer enlace"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-[1.25fr_1fr_1fr]">
          <label className={LABEL}>
            Entorno de misión
            <select className={INPUT} value={state.mission} onChange={(e) => onChangeMission(e.currentTarget.value)}>
              {Object.entries(MISSIONS).map(([key, item]) => (
                <option key={key} value={key}>{item.name}</option>
              ))}
            </select>
          </label>

          <div className="rounded-xl border border-slate-800 bg-[#0b1524] px-3 py-2.5">
            <p className="flex items-center gap-2 text-xs text-slate-300">
              <Clock size={14} aria-hidden="true" /> Retraso simulado por trayecto
            </p>
            <p className="mt-1 font-mono text-sm text-cyan-200">
              {mission.latency} <span className="ml-2 text-slate-300">{mission.gravity}</span>
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0b1524] px-3 py-2.5 sm:col-span-2 xl:col-span-1">
            <div className="flex justify-between gap-2 text-xs text-slate-200">
              <span className="flex items-center gap-2"><Award size={15} aria-hidden="true" /> Preparación de misión</span>
              <b className="font-mono text-cyan-200">{readiness}%</b>
            </div>
            <progress aria-label="Preparación de misión" className="mt-2 block h-2 w-full accent-cyan-400" value={readiness} max={100} />
            <p className="mt-1 text-xs text-slate-300">
              {checkedCount}/{TASKS.length} rutinas · Racha de {streak} {streak === 1 ? "día" : "días"}
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-300" role="status">
          Simulación educativa <span className="px-2 text-slate-500">·</span>
          {state.connection ? "Enlace disponible" : "Enlace interrumpido"}
          <span className="px-2 text-slate-500">·</span>
          <span className={apiOnline ? "text-emerald-300" : "text-amber-300"}>
            {apiOnline ? "Backend conectado (Puerto 4000)" : "Modo local (Backend desconectado)"}
          </span>
          {(mission.delay > 300 || !state.connection) && (
            <span className="ml-2 font-semibold text-amber-300">· Modo autónomo de triaje activo</span>
          )}
        </p>
        {storageError && <p role="alert" className="mt-2 text-xs text-amber-200">El navegador impide guardar los cambios al recargar.</p>}
      </div>
    </header>
  );
}
