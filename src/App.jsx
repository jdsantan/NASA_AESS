import { useEffect, useMemo, useRef, useState } from "react";
import { BASELINE, FIELDS, MISSIONS, PANEL, SCENARIOS, STORAGE, SYSTEMS, TASKS } from "./data/astriaConfig.js";
import { assess, dateKey, historyFor, initialState, shiftDate } from "./utils/telemetryLogic.js";
import { fetchReportsFromServer, syncPendingReports } from "./services/api.js";

import Header from "./components/Header.jsx";
import AcquisitionSidebar from "./components/AcquisitionSidebar.jsx";
import BodyMap from "./components/BodyMap.jsx";
import TrendChart from "./components/TrendChart.jsx";
import TriageSidebar from "./components/TriageSidebar.jsx";
import Badge from "./components/Badge.jsx";
import GuideModal from "./components/GuideModal.jsx";

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
    <div className="min-h-screen bg-[#080e19] font-sans text-slate-100 selection:bg-cyan-400/25">
      <Header
        state={state} mission={mission} readiness={readiness}
        checkedCount={checked.length} streak={streak} apiOnline={apiOnline} storageError={storageError}
        onToggleLink={toggleLink}
        onChangeMission={(next) => setState((curr) => ({ ...curr, mission: next }))}
      />

      <main className="mx-auto grid max-w-[1570px] items-start gap-5 px-4 py-6 sm:px-8 xl:grid-cols-[minmax(245px,0.85fr)_minmax(350px,1.4fr)_minmax(280px,1fr)]">
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

        <div className="grid min-w-0 gap-5">
          <BodyMap statuses={statuses} selected={selected} onSelect={setSelected} />
          <section className={PANEL} aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <SystemIcon size={19} className="text-cyan-300" aria-hidden="true" /> {activeSystem.name}
              </h2>
              <Badge level={statuses[selected]} />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{activeSystem.detail}</p>
            {selectedAlert && <p className="mt-2 text-sm text-amber-200">{selectedAlert.title}</p>}
            {missingSystems[selected] && <p className="mt-2 text-sm text-amber-200">Faltan lecturas de este sistema.</p>}
          </section>
          <TrendChart history={historyFor(state.scenario, values)} metric={metric} onMetric={setMetric} />
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
      </main>

      <GuideModal dialogRef={guide} />
    </div>
  );
}
