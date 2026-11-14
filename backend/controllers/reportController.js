import { randomUUID } from "node:crypto";
import { BASELINE } from "../config/baseline.js";
import { evaluateTriage } from "../services/triageService.js";
import { readDB, writeDB } from "../utils/fileDb.js";

const MISSIONS = new Set(["iss", "transit", "moon", "mars"]);
const SCENARIOS = new Set(["nominal", "solar", "sans", "oxygen", "fatigue"]);
const TASKS = new Set(["exercise", "nutrition", "journal", "eva"]);
const isRecord = (value) => Boolean(value && typeof value === "object" && !Array.isArray(value));

function parseReport(payload, needsId) {
  if (!isRecord(payload) || !isRecord(payload.values)) return null;
  const { id = needsId ? "" : randomUUID(), created, mission, scenario, values, checked = [], image } = payload;
  if (typeof id !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(id)) return null;
  if (!MISSIONS.has(mission) || !SCENARIOS.has(scenario)) return null;
  if (!Array.isArray(checked) || !checked.every((task) => TASKS.has(task))) return null;
  if (created !== undefined && (typeof created !== "string" || !Number.isFinite(Date.parse(created)))) return null;

  const readings = {};
  for (const field of Object.keys(BASELINE)) {
    const value = values[field] ?? "";
    if (value !== "" && (typeof value !== "number" || !Number.isFinite(value) || value < 0)) return null;
    readings[field] = value;
  }
  if (values.mood !== undefined && !["estable", "bajo"].includes(values.mood)) return null;
  if (values.visual !== undefined && typeof values.visual !== "boolean") return null;
  readings.mood = values.mood ?? "estable";
  readings.visual = values.visual ?? false;

  let imageRecord = null;
  if (image != null) {
    if (!isRecord(image) || typeof image.name !== "string" || image.name.length > 255) return null;
    if (image.note !== undefined && (typeof image.note !== "string" || image.note.length > 300)) return null;
    if (image.time !== undefined && (typeof image.time !== "string" || !Number.isFinite(Date.parse(image.time)))) return null;
    imageRecord = { name: image.name, note: image.note ?? "", time: image.time ?? null };
  }

  const alerts = evaluateTriage(readings, scenario, checked);
  return {
    id, created: created ?? new Date().toISOString(), mission, scenario, values: readings,
    findings: alerts.map((alert) => alert.title), alerts, status: "delivered", image: imageRecord,
  };
}

export function getReports() {
  return { status: 200, body: readDB().reports };
}

export function createReport(payload) {
  const report = parseReport(payload, false);
  if (!report) return { status: 400, body: { error: "El reporte contiene datos inválidos." } };

  const db = readDB();
  const previous = db.reports.find((entry) => entry.id === report.id);
  if (previous) return { status: 200, body: previous };

  db.reports.unshift(report);
  writeDB(db);
  return { status: 201, body: report };
}

export function syncReports(payload) {
  const pending = payload?.pendingReports;
  if (!Array.isArray(pending) || pending.length > 100) {
    return { status: 400, body: { error: "La sincronización admite hasta 100 reportes por solicitud." } };
  }
  const updates = pending.map((entry) => parseReport(entry, true));
  if (updates.some((entry) => entry === null)) {
    return { status: 400, body: { error: "La lista contiene reportes inválidos." } };
  }

  const db = readDB();
  const recorded = new Map(db.reports.map((entry) => [entry.id, entry]));
  let syncedCount = 0;
  for (const entry of updates) {
    if (recorded.has(entry.id)) continue;
    const synced = { ...entry, syncedAt: new Date().toISOString() };
    recorded.set(synced.id, synced);
    db.reports.unshift(synced);
    syncedCount += 1;
  }
  if (syncedCount) writeDB(db);

  return { status: 200, body: { syncedCount, reports: db.reports } };
}
