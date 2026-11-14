import { useId } from "react";
import { Bone, Brain, Heart, Wind } from "lucide-react";

const BODY_SYSTEMS = {
  neuro: {
    label: "Neurológico y visual",
    short: "Neurovisual",
    Icon: Brain,
    x: 140,
    y: 43,
  },
  cardio: {
    label: "Cardiovascular",
    short: "Cardiovascular",
    Icon: Heart,
    x: 156,
    y: 123,
  },
  bone: {
    label: "Musculoesquelético",
    short: "Músculo y hueso",
    Icon: Bone,
    x: 124,
    y: 228,
  },
  resp: {
    label: "Inmune y respiratorio",
    short: "Respiratorio",
    Icon: Wind,
    x: 116,
    y: 105,
  },
};

const BODY_STATES = {
  ok: { label: "Óptimo", color: "#34d399", text: "text-emerald-300" },
  warn: { label: "Precaución", color: "#fbbf24", text: "text-amber-300" },
  critical: { label: "Crítico", color: "#fb7185", text: "text-rose-300" },
};

export default function BodyMap({ statuses, selected, onSelect }) {
  const svgId = useId();

  return (
    <section className="min-w-0 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-semibold text-slate-100">Mapa de salud</h2>
        <span className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-400">Simulación</span>
      </div>
      <div className="mt-3 grid overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
        <svg
          viewBox="0 0 280 332"
          role="group"
          aria-label="Silueta humana con cuatro sistemas seleccionables"
          className="mx-auto h-[278px] w-full max-w-[290px]"
        >
          <defs>
            <pattern id={`${svgId}-grid`} width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M20 0H0V20" fill="none" stroke="#1e293b" strokeWidth="1" />
            </pattern>
            <linearGradient id={`${svgId}-body`} x2="0" y2="1">
              <stop offset="0%" stopColor="#155e75" stopOpacity=".48" />
              <stop offset="100%" stopColor="#164e63" stopOpacity=".14" />
            </linearGradient>
          </defs>
          <rect x="14" y="10" width="252" height="308" fill={`url(#${svgId}-grid)`} />
          <g fill="none" stroke="#164e63" strokeWidth="1" aria-hidden="true">
            <path d="M140 11v310M31 167h218" strokeDasharray="3 6" />
            <circle cx="140" cy="146" r="88" strokeDasharray="4 8" />
            <circle cx="140" cy="146" r="108" strokeDasharray="2 12" />
            <path d="M16 37V15h22M242 15h22v22M16 290v22h22M242 312h22v-22" />
          </g>
          <g
            fill={`url(#${svgId}-body)`}
            stroke="#4ca6b8"
            strokeWidth="1.6"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M140 18c-16 0-26 13-26 30 0 13 7 24 16 29l-1 9-22 5c-11 3-17 11-21 22l-9 35-16 44-8 14c-2 4 0 8 4 8l9-8 4 2c3 2 7 0 7-4l1-11 17-34 13-36 5 38-4 45 6 36 3 51-5 13c-2 4 1 8 6 8h13c4 0 7-3 7-7l2-42 2-32 4-43h2l4 43 2 32 2 42c0 4 3 7 7 7h13c5 0 8-4 6-8l-5-13 3-51 6-36-4-45 5-38 13 36 17 34 1 11c0 4 4 6 7 4l4-2 9 8c4 0 6-4 4-8l-8-14-16-44-9-35c-4-11-10-19-21-22l-22-5-1-9c9-5 16-16 16-29 0-17-10-30-26-30Z" transform="translate(-3 0)" />
            <path d="M137 76v102m-28-82 28 13 28-13m-47 68 19 11 18-11m-31 32-1 47 2 48m26-95 2 47-2 48" fill="none" opacity=".3" />
          </g>
          {Object.entries(BODY_SYSTEMS).map(([key, system]) => {
            const state = BODY_STATES[statuses[key]] ?? BODY_STATES.ok;
            const active = key === selected;
            return (
              <g
                key={key}
                role="button"
                tabIndex={0}
                aria-label={`${system.label}, ${state.label}`}
                aria-pressed={active}
                onClick={() => onSelect(key)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(key);
                  }
                }}
                transform={`translate(${system.x} ${system.y})`}
                className="group cursor-pointer outline-none transition-opacity hover:opacity-85"
              >
                <circle r="21" fill="transparent" />
                <circle r="17" fill={state.color} opacity={active ? ".20" : ".10"} />
                <circle r="13" fill="none" stroke={state.color} strokeWidth={active ? 2 : 1} opacity=".8" />
                <circle r="20" fill="none" stroke="#fff" strokeWidth="2" className="opacity-0 group-focus-visible:opacity-100" />
                <circle r={active ? 6 : 4.5} fill={state.color} />
              </g>
            );
          })}
        </svg>
        <div className="flex flex-col justify-center gap-2 border-t border-slate-800 p-3 sm:border-l sm:border-t-0">
          {Object.entries(BODY_SYSTEMS).map(([key, { short, Icon }]) => {
            const state = BODY_STATES[statuses[key]] ?? BODY_STATES.ok;
            const active = selected === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelect(key)}
                aria-pressed={active}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${active ? "border-cyan-700 bg-cyan-950/70 text-cyan-100" : "border-slate-800 text-slate-300 hover:border-slate-600"}`}
              >
                <Icon aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 ${state.text}`} />
                <span className="min-w-0 flex-1">{short}</span>
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: state.color }} aria-label={state.label} />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
