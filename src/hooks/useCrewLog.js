import { useEffect, useState } from "react";
import { syncCrewLog } from "../services/api.js";
import { applyLogAction, EMPTY_LOG } from "../utils/crewLog.js";

const KEY = "astria-crew-log-v1";

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved?.remote && Array.isArray(saved.pending)) return saved;
  } catch {
    // Keep the workspace usable if storage is unavailable or corrupt.
  }
  return { remote: EMPTY_LOG, pending: [] };
}

export default function useCrewLog(connected, localOnly = false) {
  const [store, setStore] = useState(load);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(store));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [store]);

  useEffect(() => {
    if (!connected || localOnly) return;
    const controller = new AbortController();
    let timer;

    async function refresh() {
      try {
        const result = await syncCrewLog(store.pending.slice(0, 50), controller.signal);
        if (controller.signal.aborted) return;
        const confirmed = new Set(result.acknowledged);
        setStore((current) => {
          const pending = current.pending.filter((event) => !confirmed.has(event.eventId));
          return pending.length === current.pending.length && JSON.stringify(current.remote) === JSON.stringify(result.log)
            ? current
            : { remote: result.log, pending: pending.length === current.pending.length ? current.pending : pending };
        });
      } catch {
        // Retain pending changes and retry when the backend is available.
      }
      if (!controller.signal.aborted) timer = window.setTimeout(refresh, 3000);
    }

    refresh();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [connected, localOnly, store.pending]);

  function onAction(action) {
    const event = { ...action, eventId: crypto.randomUUID() };
    setStore((current) => localOnly
      ? { ...current, remote: applyLogAction(current.remote, event) }
      : { ...current, pending: [...current.pending, event] });
  }

  return { log: store.pending.reduce(applyLogAction, store.remote), pending: store.pending.length, onAction, storageError };
}
