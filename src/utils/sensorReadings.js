import { BASELINE, CABIN_OXYGEN_REFERENCE, SCENARIOS } from "../data/astriaConfig.js";
import { CREW } from "../data/crew.js";

const FIRST_MEMBER = CREW[0].id;
const MAX_POINTS = 180;
const HEART_RATE_STEPS = [0, 1, 0, -1, 0, -1, 0, 1];
const CABIN_OXYGEN_WAVE = [0, 0.5, 1, 0.5, 0, -0.5, -1, -0.5];
const CABIN_OXYGEN_AMPLITUDE = 0.05;
const RADIATION_INCREMENT_PER_SAMPLE = 0.01;
const MAX_RADIATION_DOSE = 5000;

function round(value, digits) {
  return Number(value.toFixed(digits));
}

export function cabinFor(state) {
  if (Number.isFinite(state.cabin?.oxygen) || state.cabin?.oxygen === "") return state.cabin;
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

export function updateCabinOxygen(state, oxygen, time) {
  const cabin = cabinFor(state);
  const reference = Number.isFinite(oxygen) ? oxygen : cabin.reference;
  return setCabin(state, { ...cabin, oxygen, reference, index: 0 }, time);
}

function sampleMemberReading(reading, time) {
  const reference = { ...BASELINE, ...SCENARIOS[reading.scenario].values };
  const sampleIndex = reading.sampleIndex + 1;
  const { heart: currentHeartRate, radiation: currentRadiation } = reading.values;
  const heartRate = Number.isFinite(currentHeartRate) ? currentHeartRate : reference.heart;
  const radiationDose = Number.isFinite(currentRadiation) ? currentRadiation : reference.radiation;

  return {
    ...reading, sampleIndex, lastSample: time,
    values: {
      ...reading.values,
      heart: heartRate + HEART_RATE_STEPS[sampleIndex % HEART_RATE_STEPS.length],
      radiation: round(Math.min(radiationDose + RADIATION_INCREMENT_PER_SAMPLE, MAX_RADIATION_DOSE), 2),
    },
  };
}

export function sampleTelemetry(state, now = new Date()) {
  const time = now.toISOString();
  const cabin = cabinFor(state);
  const index = cabin.index + 1;
  const oxygen = round(cabin.reference + CABIN_OXYGEN_WAVE[index % CABIN_OXYGEN_WAVE.length] * CABIN_OXYGEN_AMPLITUDE, 2);
  const stateWithCabinSample = setCabin(state, { ...cabin, index, oxygen }, time);

  return CREW.reduce(
    (nextState, crewMember) => updateMemberReading(nextState, crewMember, (reading) => sampleMemberReading(reading, time), time),
    stateWithCabinSample,
  );
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
