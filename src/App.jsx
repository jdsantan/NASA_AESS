import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { BASELINE, FIELDS, MISSIONS, PANEL, SCENARIOS, STORAGE, SYSTEMS, TASKS } from "./data/astriaConfig";
import { assess, dateKey, historyFor, initialState, shiftDate } from "./utils/telemetryLogic";
import { fetchReportsFromServer, syncPendingReports } from "./services/api";

import Header from "./components/Header";
import AcquisitionSidebar from "./components/AcquisitionSidebar";
import BodyMap from "./components/BodyMap";
import TriageSidebar from "./components/TriageSidebar";
import Badge from "./components/Badge";
import GuideModal from "./components/GuideModal";
import { CREW } from "./data/crew.js";
import { crewTelemetry, CrewPage, DashboardSummary, MemberPage, MissionNav, PageHeading, TrendsPage } from "./pages/MissionPages.jsx";
import { activitiesFor, ActivitiesPage, MemberRoutines } from "./pages/ActivitiesPage.jsx";
import SourcesPage from "./pages/SourcesPage.jsx";
import useCrewLog from "./hooks/useCrewLog.js";

function subscribeToPage(onChange) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function pageFromUrl() {
  return window.location.hash.slice(1) || "/";
}

export default function App() {
  const [state, setState] = useState(initialState);
  const [selected, setSelected] = useState("neuro");
  const [metric, setMetric] = useState("radiation");
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
  const crewLog = useCrewLog(state.connection);
  const crew = CREW.map((member) => crewTelemetry(member, activitiesFor(crewLog.log, member.id, day)));
  const member = crew.find(({ id }) => page === "/integrantes/" + id);

  useEffect(() => {
    if (lastPage.current === page) return;
    lastPage.current = page;
    main.current?.focus();
    window.scrollTo(0, 0);
  }, [page]);

  const mission = MISSIONS[state.mission];
  const values = state.values;
  const checked = state.daily[day] || [];
  const alerts = assess(values, state.scenario, checked);
  const readiness = Math.round((100 * checked.length) / TASKS.length);
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
  if (checked.length !== TASKS.length) now.setTime(shiftDate(now, -1).getTime());
  while (state.daily[dateKey(shiftDate(now, -streak))]?.length === TASKS.length) streak += 1;

  const pending = useMemo(() => state.reports.filter((report) => report.status === "pending"), [state.reports]);
  const pendingCount = pending.length;

  useEffect(() => {
    if (!state.connection) {
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
      scenario: state.scenario,
      values,
      checked,
      image: state.imageRecord,
      findings: alerts.map((alert) => alert.title),
      status: "pending",
    };
    setState((current) => ({ ...current, reports: [report, ...current.reports] }));
  }

  function toggleLink() {
    setState((current) => ({ ...current, connection: !current.connection }));
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 selection:bg-blue-500/20">
      <Header
        state={state} mission={mission} readiness={readiness}
        checkedCount={checked.length} streak={streak} apiOnline={apiOnline} storageError={storageError || crewLog.storageError} showReadiness={page === "/simulador"}
        onToggleLink={toggleLink}
        onChangeMission={(next) => setState((curr) => ({ ...curr, mission: next }))}
      />

      <MissionNav page={page} />

      <main ref={main} tabIndex={-1} aria-labelledby="page-title" className="mx-auto max-w-7xl px-4 py-6 outline-none sm:px-8 sm:py-8">
        {page === "/" ? (
          <>
            <PageHeading title="Dashboard de misión" back={null} />
            <DashboardSummary mission={mission} scenario={state.scenario} alerts={alerts} missing={missing} pendingCount={pendingCount} crew={crew} />
          </>
        ) : page === "/simulador" ? (
          <>
            <PageHeading title="Simulador de misión" description="Edita la telemetría del escenario general y registra reportes de prueba." />
            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
              <div className="grid min-w-0 gap-5">
                <AcquisitionSidebar
                  scenario={state.scenario} values={values}
                  image={image} imageError={imageError} note={note} imageRecord={state.imageRecord}
                  onChooseScenario={(sc) => setState((curr) => ({ ...curr, scenario: sc, values: { ...BASELINE, ...SCENARIOS[sc].values } }))}
                  onUpdateValue={(key, val) => setState((curr) => ({ ...curr, values: { ...curr.values, [key]: val } }))}
                  onOpenImage={openImage}
                  onImageLoadError={() => { setImage(null); setImageError("El navegador no pudo abrir el archivo como imagen."); }}
                  onChangeNote={setNote}
                  onSaveImageRecord={() => setState((curr) => ({
                    ...curr, imageRecord: { name: image.name, note: note.trim(), time: new Date().toISOString() },
                  }))}
                />

                <details className="group min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <summary className="cursor-pointer rounded font-semibold text-blue-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600">
                    Explorar mapa del escenario
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
                alerts={alerts} missing={missing} checked={checked}
                pendingCount={pendingCount} deliveredCount={state.reports.filter((report) => report.status === "delivered").length} latest={state.reports[0]}
                onOpenGuide={() => guide.current?.showModal()}
                onMarkTask={(key) => setState((curr) => {
                  const tasks = curr.daily[day] || [];
                  return {
                    ...curr,
                    daily: { ...curr.daily, [day]: tasks.includes(key) ? tasks.filter((t) => t !== key) : [...tasks, key] },
                  };
                })}
                onSaveReport={saveReport}
              />
            </div>
          </>
        ) : page === "/integrantes" ? (
          <CrewPage crew={crew} />
        ) : member ? (
          <MemberPage key={member.id} member={member}>
            <MemberRoutines member={member} log={crewLog.log} day={day} onAction={crewLog.onAction} />
          </MemberPage>
        ) : page === "/tendencias" ? (
          <TrendsPage scenario={state.scenario} history={historyFor(state.scenario, values)} metric={metric} onMetric={setMetric} />
        ) : page === "/actividades" ? (
          <ActivitiesPage log={crewLog.log} day={day} onAction={crewLog.onAction} pending={crewLog.pending} />
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