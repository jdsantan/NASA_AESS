import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { FIELDS, INPUT, LABEL, MISSIONS, PANEL, STORAGE, SYSTEMS, TASKS } from "./data/astriaConfig";
import { dateKey, initialState, shiftDate } from "./utils/telemetryLogic";
import { fetchReportsFromServer, syncPendingReports } from "./services/api";

import Header from "./components/Header";
import AcquisitionSidebar from "./components/AcquisitionSidebar";
import BodyMap from "./components/BodyMap";
import TriageSidebar from "./components/TriageSidebar";
import Badge from "./components/Badge";
import GuideModal from "./components/GuideModal";
import { PUBLIC_SITE } from "./data/edition.js";
import ReportHistory from "./components/ReportHistory.jsx";
import { CREW } from "./data/crew.js";
import { crewTelemetry, CrewPage, DashboardSummary, MemberPage, MissionNav, PageHeading, TrendsPage } from "./pages/MissionPages.jsx";
import { activitiesFor, ActivitiesPage, MemberRoutines, RoutineList } from "./pages/ActivitiesPage.jsx";
import SourcesPage from "./pages/SourcesPage.jsx";
import useCrewLog from "./hooks/useCrewLog.js";
import CrewIndicators from "./components/CrewIndicators.jsx";
import { applyScenario, cabinFor, historyForMember, initializeReadings, readingsFor, sampleTelemetry, updateCabinOxygen, updateMemberReading } from "./utils/sensorReadings.js";

const TELEMETRY_SAMPLE_INTERVAL_MS = 3000;
const ROUTINE_IDS = new Set(TASKS.map(([id]) => id));

function subscribeToPage(onChange) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function pageFromUrl() {
  return window.location.hash.slice(1) || "/";
}

export default function App() {
  const [state, setState] = useState(() => initializeReadings(initialState()));
  const [selected, setSelected] = useState("neuro");
  const [live, setLive] = useState(false);
  const [trendMetric, setTrendMetric] = useState("radiation");
  const [day, setDay] = useState(dateKey);
  const [image, setImage] = useState(null);
  const [imageError, setImageError] = useState("");
  const [note, setNote] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);
  const guide = useRef(null);
  const main = useRef(null);
  const page = useSyncExternalStore(subscribeToPage, pageFromUrl);
  const lastPage = useRef(page);
  const crewLog = useCrewLog(state.connection, PUBLIC_SITE);
  const active = CREW.find(({ id }) => id === state.activeMember) ?? CREW[0];
  const crew = CREW.map((member) => {
    const reading = readingsFor(state, member);
    return crewTelemetry({ ...member, scenario: reading.scenario }, activitiesFor(crewLog.log, member.id, day), reading.values);
  });
  const member = crew.find(({ id }) => page === "/integrantes/" + id);
  const reading = readingsFor(state, active);

  const isRegister = page === "/registro" || page === "/simulador";

  useEffect(() => {
    if (!live) return;
    const timer = window.setInterval(() => {
      const now = new Date();
      setState((current) => sampleTelemetry(current, now));
    }, TELEMETRY_SAMPLE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [live]);
  useEffect(() => {
    if (lastPage.current === page) return;
    lastPage.current = page;
    main.current?.focus();
    window.scrollTo(0, 0);
  }, [page]);

  const mission = MISSIONS[state.mission];
  const { values, scenario } = reading;
  const routines = activitiesFor(crewLog.log, active.id, day);
  const checked = routines.filter(({ done }) => done).map(({ id }) => id);
  const alerts = crew.find(({ id }) => id === active.id).alerts;
  const readiness = routines.length ? Math.round((100 * checked.length) / routines.length) : 0;
  const missing = FIELDS.filter(({ key }) => values[key] === "");

  const missingSystems = {
    neuro: values.sleep === "",
    cardio: [values.heart, values.systolic, values.diastolic].includes(""),
    resp: [values.oxygen, values.radiation, values.temperature, values.glucose].includes(""),
  };

  const statuses = Object.fromEntries(
    Object.keys(SYSTEMS).map((key) => [
      key,
      alerts.find((a) => a.group === key)?.level || (missingSystems[key] ? "warn" : "ok"),
    ])
  );

  const activeSystem = SYSTEMS[selected];
  const SystemIcon = activeSystem.icon;
  const selectedAlert = alerts.find((a) => a.group === selected);

  let streak = 0;
  const now = new Date();
  if (checked.length !== routines.length) now.setTime(shiftDate(now, -1).getTime());
  while (routines.length && routines.every(({ id }) =>
    crewLog.log.completed[dateKey(shiftDate(now, -streak))]?.[active.id]?.includes(id),
  )) streak += 1;

  const pending = useMemo(() => state.reports.filter((report) => report.status === "pending"), [state.reports]);
  const pendingCount = pending.length;

  useEffect(() => {
    if (PUBLIC_SITE || !state.connection) {
      setApiOnline(false);
      return;
    }

    const controller = new AbortController();
    let retry;
    async function refresh() {
      try {
        const reports = await fetchReportsFromServer(controller.signal);
        for (let start = 0; start < pending.length; start += 50) {
          const response = await syncPendingReports(pending.slice(start, start + 50), controller.signal);
          reports.push(...response.reports);
        }
        if (controller.signal.aborted) return;
        setApiOnline(true);
        if (reports.length) {
          setState((current) => {
            const byId = new Map(current.reports.map((report) => [report.id, report]));
            for (const report of reports) byId.set(report.id, { ...report, status: "delivered", syncedAt: report.syncedAt || report.created });
            const merged = [...byId.values()].sort((a, b) => Date.parse(b.created) - Date.parse(a.created));
            return JSON.stringify(merged) === JSON.stringify(current.reports) ? current : { ...current, reports: merged };
          });
        }
      } catch {
        if (controller.signal.aborted) return;
        setApiOnline(false);
        retry = window.setTimeout(refresh, 4000);
      }
    }
    refresh();
    return () => {
      controller.abort();
      window.clearTimeout(retry);
    };
  }, [state.connection, pending]);

  useEffect(() => {
    const timer = window.setInterval(() => setDay(dateKey()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE, JSON.stringify(state));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state]);

  useEffect(() => () => {
    if (image) URL.revokeObjectURL(image.url);
  }, [image]);

  function openImage(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setImageError("Selecciona una imagen PNG, JPG o WebP de hasta 10 MB.");
      return;
    }
    setImageError("");
    setNote("");
    setImage({ name: file.name, url: URL.createObjectURL(file) });
  }

  function saveReport() {
    const report = {
      id: globalThis.crypto?.randomUUID?.() ?? (String(Date.now()) + "-" + Math.random().toString(36).slice(2)),
      created: new Date().toISOString(),
      mission: state.mission,
      scenario,
      memberId: active.id,
      values,
      checked: checked.filter((id) => ROUTINE_IDS.has(id)),
      image: reading.imageRecord ?? null,
      findings: alerts.map((alert) => alert.title),
      source: reading.lastSample ? (reading.source === "manual" ? "mixed" : "auto") : reading.source,
      status: PUBLIC_SITE ? "local" : "pending",
    };
    setState((current) => ({ ...current, reports: [report, ...current.reports] }));
  }

  function toggleLink() {
    setState((current) => ({ ...current, connection: !current.connection }));
  }

  function updateReading(update, time) {
    setState((current) => updateMemberReading(current, active, update, time));
  }

  function selectMember(id) {
    setImage(null);
    setImageError("");
    setNote("");
    setState((current) => ({ ...current, activeMember: id }));
  }

  const activePicker = (
    <label className={"w-full max-w-xs " + LABEL}>
      Astronauta activo
      <select className={INPUT} value={active.id} onChange={(event) => selectMember(event.currentTarget.value)}>
        {CREW.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
      </select>
    </label>
  );

  const indicatorProps = {
    values,
    live,
    lastSample: reading.lastSample,
    onToggleLive: () => setLive((current) => !current),
    onUpdateValue: (key, val) => {
      const time = new Date().toISOString();
      if (key === "oxygen") {
        setState((current) => updateCabinOxygen(current, val, time));
        return;
      }
      updateReading((current) => ({
        ...current, source: "manual", values: { ...current.values, [key]: val },
      }), time);
    },
  };

  const routinePanel = (
    <section className={PANEL} aria-label={`Rutinas diarias de ${active.name}`}>
      <h2 className="text-lg font-semibold text-slate-900">Rutinas diarias</h2>
      <p className="mt-1 text-sm font-medium text-slate-600">{active.name}</p>
      <RoutineList key={active.id} member={active} log={crewLog.log} day={day} onAction={crewLog.onAction} />
    </section>
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 selection:bg-blue-500/20">
      <Header
        state={state} mission={mission} publicSite={PUBLIC_SITE} readiness={readiness}
        checkedCount={checked.length} assignedCount={routines.length} streak={streak} apiOnline={apiOnline} storageError={storageError || crewLog.storageError} showReadiness={isRegister}
        onToggleLink={toggleLink}
        onChangeMission={(next) => setState((curr) => ({ ...curr, mission: next }))}
      />

      <MissionNav page={page} />

      <main ref={main} tabIndex={-1} aria-labelledby="page-title" className="mx-auto max-w-7xl px-4 py-6 outline-none sm:px-8 sm:py-8">
        {page === "/" ? (
          <>
            <PageHeading title="Dashboard de misión" back={null}>{activePicker}</PageHeading>
            <DashboardSummary mission={mission} scenario={scenario} alerts={alerts} missing={missing} activeName={active.name} pendingCount={pendingCount} savedCount={PUBLIC_SITE ? state.reports.length : undefined} crew={crew} />
            <div className="mt-5">
              <CrewIndicators crew={crew} oxygen={cabinFor(state).oxygen} />
            </div>
          </>
        ) : isRegister ? (
          <>
            <PageHeading title="Registro de lecturas" description="Revisa las lecturas automáticas y guarda un registro del astronauta activo.">
              {activePicker}
            </PageHeading>
            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
              <div className="grid min-w-0 gap-5">
                <AcquisitionSidebar
                  scenario={scenario} {...indicatorProps}
                  image={image} imageError={imageError} note={note} imageRecord={reading.imageRecord}
                  onChooseScenario={(sc) => {
                    const now = new Date();
                    setState((current) => applyScenario(current, active, sc, now));
                  }}
                  onOpenImage={openImage}
                  onImageLoadError={() => { setImage(null); setImageError("El navegador no pudo abrir el archivo como imagen."); }}
                  onChangeNote={setNote}
                  onSaveImageRecord={() => updateReading((current) => ({
                    ...current, imageRecord: { name: image.name, note: note.trim(), time: new Date().toISOString() },
                  }))}
                />

                <details className={`group min-w-0 ${PANEL}`}>
                  <summary className="cursor-pointer rounded font-semibold text-blue-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600">
                    Explorar mapa de lecturas
                  </summary>
                  <div className="mt-4 grid gap-4">
                    <BodyMap statuses={statuses} selected={selected} onSelect={setSelected} />
                    <section className={PANEL} aria-live="polite">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                          <SystemIcon size={19} className="text-blue-600" aria-hidden="true" /> {activeSystem.name}
                        </h2>
                        <Badge level={statuses[selected]} />
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{activeSystem.detail}</p>
                      {selectedAlert && <p className="mt-2 text-sm font-semibold text-amber-700">{selectedAlert.title}</p>}
                      {missingSystems[selected] && <p className="mt-2 text-sm font-semibold text-amber-700">Faltan lecturas de este sistema.</p>}
                    </section>
                  </div>
                </details>
              </div>

              <TriageSidebar
                alerts={alerts} missing={missing} publicSite={PUBLIC_SITE}
                pendingCount={pendingCount} deliveredCount={state.reports.filter((report) => report.status === "delivered").length} latest={state.reports[0]}
                onOpenGuide={() => guide.current?.showModal()}
                onSaveReport={saveReport}
              >
                {routinePanel}
              </TriageSidebar>
              <div className="lg:col-span-2"><ReportHistory reports={state.reports} /></div>
            </div>
          </>
        ) : page === "/integrantes" ? (
          <CrewPage crew={crew} />
        ) : member ? (
          <MemberPage key={member.id} member={member}>
            <MemberRoutines member={member} log={crewLog.log} day={day} onAction={crewLog.onAction} />
          </MemberPage>
        ) : page === "/tendencias" ? (
          <TrendsPage active={active} onSelectMember={selectMember} history={historyForMember(state, active.id)} metric={trendMetric} onMetric={setTrendMetric} />
        ) : page === "/actividades" ? (
          <ActivitiesPage log={crewLog.log} day={day} onAction={crewLog.onAction} pending={crewLog.pending} publicSite={PUBLIC_SITE} />
        ) : page === "/fuentes" ? (
          <SourcesPage />
        ) : (
          <PageHeading title="Página no encontrada" />
        )}
      </main>

      <GuideModal dialogRef={guide} />
    </div>
  );
}