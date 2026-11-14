import { createReport, getReports, syncReports } from "../controllers/reportController.js";

const routes = new Map([
  ["GET /api/reports", getReports],
  ["POST /api/reports", createReport],
  ["POST /api/reports/sync", syncReports],
]);

const MAX_BODY_BYTES = 1024 * 1024;

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size <= MAX_BODY_BYTES) chunks.push(chunk);
  }
  if (size > MAX_BODY_BYTES) return { status: 413, error: "Solicitud demasiado grande." };
  try {
    return { data: JSON.parse(Buffer.concat(chunks).toString("utf8")) };
  } catch {
    return { status: 400, error: "JSON inválido." };
  }
}

export async function handleReports(request) {
  const pathname = new URL(request.url, "http://127.0.0.1").pathname.replace(/\/$/, "");
  const handler = routes.get(request.method + " " + pathname);
  if (!handler) return { status: 404, body: { error: "Ruta no encontrada." } };
  if (request.method === "GET") return handler();

  const type = request.headers["content-type"]?.split(";")[0].trim().toLowerCase();
  if (type !== "application/json") return { status: 415, body: { error: "Se requiere application/json." } };
  const { data, status, error } = await readBody(request);
  return error ? { status, body: { error } } : handler(data);
}
