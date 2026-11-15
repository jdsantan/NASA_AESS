import { BASELINE, CABIN_OXYGEN_REFERENCE, SCENARIOS } from "../data/astriaConfig.js";
import { CREW } from "../data/crew.js";

const FIRST_MEMBER = CREW[0].id;
const MAX_POINTS = 180;
const variation = [0, 1, 0, -1, 1, 2, 1, 0];

function round(value, digits) {
  return Number(value.toFixed(digits));
}

export function cabinFor(state) {
  if (Number.isFinite(state.cabin?.oxygen)) return state.cabin;
  const legacy = state.memberReadings?.[FIRST_MEMBER]?.values.oxygen ?? state.values?.oxygen;
  const oxygen = Number.isFinite(legacy) ? legacy : BASELINE.oxygen;
  return { oxygen, reference: oxygen < CABIN_OXYGEN_REFERENCE ? SCENARIOS.oxygen.values.oxygen : BASELINE.oxygen, index: 0 };
}

export function readingsFor(state, member) {
  const legacy = member.id === FIRST_MEMBER;
  const saved = state.memberReadings?.[member.id];
  const scenario = saved?.scenario ?? (legacy ? state.scenario : member.scenario);
  return {
    scenario,
    source: legacy ? state.readingSource ?? "reference" : "reference",
    sampleIndex: 0,
    lastSample: null,
    imageRecord: legacy ? state.imageRecord : null,
    ...saved,
    values: {
      ...BASELINE, ...SCENARIOS[scenario].values,
      ...(saved?.values ?? (legacy ? state.values : {})),
      oxygen: cabinFor(state).oxygen,
    },
  };
}

function toPoint(reading, time) {
  const { heart, systolic: sys, diastolic: dia, sleep, mood, radiation } = reading.values;
  return { time, heart, sys, dia, sleep, mood, radiation, bone: SCENARIOS[reading.scenario]?.bone };
}

function appendPoint(history, point) {
  const start = history.at(-1)?.time === point.time ? history.slice(0, -1) : history;
  return [...start.slice(-(MAX_POINTS - 1)), point];
}

export function initializeReadings(state, now = new Date()) {
  const time = now.toISOString();
  const cabin = cabinFor(state);
  const memberHistory = Object.fromEntries(CREW.map((member) => {
    const saved = state.memberHistory?.[member.id];
    if (saved?.length) return [member.id, saved];
    const reports = state.reports.filter(({ memberId, created, values }) =>
      memberId === member.id && values && Number.isFinite(Date.parse(created)),
    );
    const points = reports.slice(0, MAX_POINTS - 1).reverse().map((report) => toPoint(report, report.created));
    return [member.id, appendPoint(points, toPoint(readingsFor(state, member), time))];
  }));

  return {
    ...state, cabin, memberHistory,
    cabinHistory: state.cabinHistory?.length ? state.cabinHistory : [{ time, o2: cabin.oxygen }],
  };
}

export function historyForMember(state, memberId) {
  return [...state.memberHistory[memberId], ...state.cabinHistory];
}

function setCabin(state, cabin, time) {
  return { ...state, cabin, cabinHistory: appendPoint(state.cabinHistory, { time, o2: cabin.oxygen }) };
}

export function updateMemberReading(state, member, update, time) {
  const reading = update(readingsFor(state, member));
  const { oxygen: _cabinOxygen, ...values } = reading.values;
  return {
    ...state,
    memberReadings: { ...state.memberReadings, [member.id]: { ...reading, values } },
    memberHistory: {
      ...state.memberHistory,
      [member.id]: time ? appendPoint(state.memberHistory[member.id], toPoint(reading, time)) : state.memberHistory[member.id],
    },
  };
}

export function sampleTelemetry(state, member, now = new Date()) {
  const time = now.toISOString();
  const cabin = cabinFor(state);
  const index = cabin.index + 1;
  const oxygen = round(cabin.reference + variation[index % variation.length] * 0.04, 2);
  const next = setCabin(state, { ...cabin, index, oxygen }, time);

  return updateMemberReading(next, member, (reading) => {
    const reference = { ...BASELINE, ...SCENARIOS[reading.scenario].values };
    const sampleIndex = reading.sampleIndex + 1;
    const change = variation[sampleIndex % variation.length];
    return {
      ...reading, sampleIndex, lastSample: time,
      values: {
        ...reading.values,
        heart: reference.heart + change,
        sleep: round(reference.sleep + change * 0.02, 2),
        radiation: round(Math.min((Number.isFinite(reading.values.radiation) ? reading.values.radiation : reference.radiation) + 0.00002, 5000), 5),
      },
    };
  }, time);
}

export function applyScenario(state, member, scenario, now = new Date()) {
  const configuration = SCENARIOS[scenario];
  if (!configuration) return state;
  const time = now.toISOString();
  let next = state;
  if (scenario === "nominal" || scenario === "oxygen") {
    const oxygen = configuration.values.oxygen ?? BASELINE.oxygen;
    next = setCabin(next, { oxygen, reference: oxygen, index: 0 }, time);
  }
  const { oxygen: _cabinOxygen, ...personal } = configuration.values;
  next = updateMemberReading(next, member, (reading) => ({
    ...reading, scenario, source: "reference", sampleIndex: 0, lastSample: null,
    values: {
      ...(scenario === "nominal" ? BASELINE : reading.values), ...personal,
      radiation: scenario === "nominal" ? BASELINE.radiation : Math.max(Number(reading.values.radiation) || 0, personal.radiation ?? 0),
    },
  }), time);

  if (scenario === "solar") {
    for (const crewMember of CREW) {
      if (crewMember.id === member.id) continue;
      next = updateMemberReading(next, crewMember, (reading) => {
        const radiation = Math.max(Number(reading.values.radiation) || 0, personal.radiation);
        return { ...reading, values: { ...reading.values, radiation } };
      }, time);
    }
  }
  return next;
}
