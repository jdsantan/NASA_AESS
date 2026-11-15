import { useId } from "react";
import { ChevronRight } from "lucide-react";
import { INSTRUMENT_LABEL, INSTRUMENT_PANEL, STATUS_SIGNAL, TOOLS } from "../data/astriaConfig.js";
import { alertTitle } from "../utils/telemetryLogic.js";

const VITAL_SIGN_CHANNELS = [
  { label: "Pulso en reposo", unit: "lpm", readingKeys: ["heart"] },
  { label: "Presión arterial", unit: "mmHg", readingKeys: ["systolic", "diastolic"] },
  { label: "Sueño", unit: "h", readingKeys: ["sleep"] },
  { label: "Dosis", unit: "mSv", readingKeys: ["radiation"] },
];

const MISSION_PROGRESS_SEGMENT_COUNT = 24;
const NOMINAL_STATUS_MESSAGE = "Sin cambios destacados.";

const readingFormatter = new Intl.NumberFormat("es", { maximumFractionDigits: 1 });

const getInitials = (fullName) => fullName.split(" ").map((namePart) => namePart[0]).join("").slice(0, 2);

const formatReading = (reading) => (typeof reading === "number" ? readingFormatter.format(reading) : "—");

const padMissionDay = (dayCount) => String(dayCount).padStart(3, "0");

const getPrimaryStatusMessage = (alerts) => (alerts[0] ? alertTitle(alerts[0]) : NOMINAL_STATUS_MESSAGE);

const getChannelLevel = (alerts, readingKeys) =>
  alerts.find(({ fields }) => fields.some((field) => readingKeys.includes(field)))?.level ?? "ok";

function CrewMonogram({ fullName, sizeClassName = "size-14 text-base" }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-md border border-blue-600/25 bg-blue-50 font-mono font-semibold tracking-wider text-blue-800 ${sizeClassName}`}
    >
      {getInitials(fullName)}
    </span>
  );
}

function StatusReadout({ level }) {
  const { marker, text } = STATUS_SIGNAL[level];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${text}`}>
      <span aria-hidden="true" className={`size-2 rounded-[2px] ${marker}`} />
      {TOOLS[level].text}
    </span>
  );
}

function MissionProgress({ missionDay, missionLength }) {
  const completedFraction = Math.min(1, missionDay / missionLength);
  const completedSegmentCount = Math.round(completedFraction * MISSION_PROGRESS_SEGMENT_COUNT);
  const remainingDayCount = Math.max(0, missionLength - missionDay);

  return (
    <div className="px-4 py-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className={INSTRUMENT_LABEL}>Día de misión</span>
        <span className="font-mono text-sm tabular-nums text-slate-900">
          <span className="font-semibold">{padMissionDay(missionDay)}</span>
          <span className="text-slate-400"> / {padMissionDay(missionLength)}</span>
        </span>
      </div>
      <div
        className="mt-2 flex gap-[3px]"
        role="progressbar"
        aria-label="Progreso de la misión"
        aria-valuemin={0}
        aria-valuemax={missionLength}
        aria-valuenow={missionDay}
      >
        {Array.from({ length: MISSION_PROGRESS_SEGMENT_COUNT }, (_, segmentIndex) => (
          <span
            key={segmentIndex}
            className={`h-2 flex-1 rounded-[1px] ${segmentIndex < completedSegmentCount ? "bg-blue-600" : "bg-slate-200"}`}
          />
        ))}
      </div>
      <p className="mt-1.5 text-right font-mono text-[11px] tabular-nums text-slate-500">
        Restan {remainingDayCount} d
      </p>
    </div>
  );
}

function VitalSignCell({ label, unit, level, displayValue }) {
  const { marker, tint } = STATUS_SIGNAL[level];
  return (
    <div className={`min-w-0 px-4 py-3 ${tint}`}>
      <dt className={`flex items-center justify-between gap-2 ${INSTRUMENT_LABEL}`}>
        <span className="truncate">{label}</span>
        <span aria-hidden="true" className={`size-2 shrink-0 rounded-[2px] ${marker}`} />
        <span className="sr-only">({TOOLS[level].text})</span>
      </dt>
      <dd className="mt-1 flex items-baseline gap-1.5">
        <span className="font-mono text-xl font-semibold tabular-nums tracking-tight text-slate-950">{displayValue}</span>
        <span className="font-mono text-[11px] text-slate-500">{unit}</span>
      </dd>
    </div>
  );
}

function CompactProfileCard({ member, href, headingId }) {
  const { name, alerts, level, profile = {} } = member;
  const { callsign, role } = profile;

  return (
    <a
      href={href}
      aria-labelledby={headingId}
      className={`group flex h-full items-center gap-3.5 border-l-2 px-4 py-3.5 transition hover:border-slate-900/30 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${INSTRUMENT_PANEL} ${STATUS_SIGNAL[level].ruleLeft}`}
    >
      <CrewMonogram fullName={name} sizeClassName="size-11 text-sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[11px] tracking-wider text-slate-500">{callsign}</span>
          <StatusReadout level={level} />
        </div>
        <h3 id={headingId} className="mt-0.5 truncate font-semibold tracking-tight text-slate-950">
          {name}
          {role && <span className="ml-2 text-sm font-normal text-slate-500">{role}</span>}
        </h3>
        <p className="mt-1 truncate text-sm text-slate-700">{getPrimaryStatusMessage(alerts)}</p>
      </div>
      <ChevronRight
        size={16}
        aria-hidden="true"
        className="hidden shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-700 sm:block"
      />
    </a>
  );
}

export default function AstronautProfileCard({ member, href, compact = false }) {
  const headingId = useId();
  if (compact) return <CompactProfileCard member={member} href={href} headingId={headingId} />;

  const { name, readings, alerts, level, profile = {} } = member;
  const { callsign, role, specialty, age, bloodType, evaHours, missionDay, missionLength } = profile;
  const hasMissionClock = missionDay != null && missionLength > 0;
  const personalRecordEntries = [
    age != null && ["Edad", `${age} a`],
    bloodType && ["Grupo", bloodType],
    evaHours != null && ["EVA", `${readingFormatter.format(evaHours)} h`],
  ].filter(Boolean);

  return (
    <article
      aria-labelledby={headingId}
      className={`overflow-hidden border-t-2 ${INSTRUMENT_PANEL} ${STATUS_SIGNAL[level].ruleTop}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-900/10 bg-slate-50 px-4 py-2">
        <span className="font-mono text-[11px] font-semibold tracking-wider text-slate-600">{callsign ?? "TRIPULANTE"}</span>
        <StatusReadout level={level} />
      </div>

      <header className="flex items-center gap-3.5 px-4 py-4">
        <CrewMonogram fullName={name} />
        <div className="min-w-0 flex-1">
          <h2 id={headingId} className="truncate text-lg font-semibold tracking-tight text-slate-950">{name}</h2>
          {role && <p className="text-sm font-medium text-slate-700">{role}</p>}
          {specialty && <p className="truncate text-sm text-slate-500">{specialty}</p>}
        </div>
      </header>

      <div className={`border-y border-slate-900/10 px-4 py-3 ${STATUS_SIGNAL[level].tint}`}>
        <p className={INSTRUMENT_LABEL}>Observación principal</p>
        <p className="mt-1 text-sm font-medium text-slate-900">{getPrimaryStatusMessage(alerts)}</p>
      </div>

      {hasMissionClock && <MissionProgress missionDay={missionDay} missionLength={missionLength} />}

      <dl className="grid grid-cols-2 gap-px border-y border-slate-900/10 bg-slate-900/10">
        {VITAL_SIGN_CHANNELS.map(({ label, unit, readingKeys }) => (
          <VitalSignCell
            key={label}
            label={label}
            unit={unit}
            level={getChannelLevel(alerts, readingKeys)}
            displayValue={readingKeys.map((readingKey) => formatReading(readings[readingKey])).join("/")}
          />
        ))}
      </dl>

      {personalRecordEntries.length > 0 && (
        <dl className="flex divide-x divide-slate-900/10 bg-slate-50">
          {personalRecordEntries.map(([entryLabel, entryValue]) => (
            <div key={entryLabel} className="min-w-0 flex-1 px-4 py-2.5">
              <dt className={INSTRUMENT_LABEL}>{entryLabel}</dt>
              <dd className="mt-0.5 font-mono text-sm tabular-nums text-slate-900">{entryValue}</dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}
