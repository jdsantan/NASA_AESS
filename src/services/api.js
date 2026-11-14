const REPORTS_URL = "/api/reports";

async function request(path, signal, body) {
  const response = await fetch(path, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]),
    ...(body === undefined ? {} : {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  });
  if (!response.ok) throw new Error(`La API de reportes devolvió HTTP ${response.status}.`);
  return response.json();
}

export async function fetchReportsFromServer(signal) {
  const reports = await request(REPORTS_URL, signal);
  if (!Array.isArray(reports)) throw new Error("Historial de reportes inválido.");
  return reports;
}

export async function syncPendingReports(pendingReports, signal) {
  const result = await request(REPORTS_URL + "/sync", signal, { pendingReports });
  if (!Array.isArray(result.reports)) throw new Error("Confirmación de sincronización inválida.");
  return result;
}

export async function syncCrewLog(events, signal) {
  return request("/api/crew-log", signal, events.length ? { events } : undefined);
}
