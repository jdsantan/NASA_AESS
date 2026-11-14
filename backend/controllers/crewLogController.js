import { CREW } from "../../src/data/crew.js";
import { applyLogAction, EMPTY_LOG } from "../../src/utils/crewLog.js";
import { readDB, writeDB } from "../utils/fileDb.js";

const members = new Set(CREW.map(({ id }) => id));
const validId = (value) => typeof value === "string" && /^[a-z0-9_-]{1,100}$/i.test(value);
const validText = (value, size) => typeof value === "string" && value.trim().length > 0 && value.length <= size;

function validAction(action) {
  if (!validId(action?.eventId)) return false;
  if (action.type === "add") {
    const item = action.activity;
    return validId(item?.id) && validText(item.title, 100) && validText(item.description, 300)
      && Array.isArray(item.members) && item.members.length > 0 && item.members.length <= members.size
      && item.members.every((id) => members.has(id));
  }
  if (action.type === "comment") {
    const item = action.comment;
    return validId(item?.id) && members.has(item.author) && (!item.subject || members.has(item.subject))
      && validText(item.text, 500) && typeof item.created === "string" && Number.isFinite(Date.parse(item.created));
  }
  if (!members.has(action.member) || !validId(action.id)) return false;
  return action.type === "remove" || (action.type === "check" && typeof action.done === "boolean"
    && typeof action.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(action.day));
}

export function getCrewLog() {
  return { status: 200, body: { log: readDB().crewLog ?? EMPTY_LOG, acknowledged: [] } };
}

export function updateCrewLog(payload) {
  const events = payload?.events;
  if (!Array.isArray(events) || events.length > 50 || !events.every(validAction)) {
    return { status: 400, body: { error: "Cambios de bitácora inválidos." } };
  }
  const db = readDB();
  let log = db.crewLog ?? EMPTY_LOG;
  const confirmed = new Set(db.crewEvents ?? []);
  let changed = false;
  for (const event of events) {
    if (confirmed.has(event.eventId)) continue;
    log = applyLogAction(log, event);
    confirmed.add(event.eventId);
    changed = true;
  }
  if (changed) writeDB({ ...db, crewLog: log, crewEvents: [...confirmed] });
  return { status: 200, body: { log, acknowledged: events.map(({ eventId }) => eventId) } };
}
