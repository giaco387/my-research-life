import { STAGES } from "../data/stages.js";
import { INITIAL_PROGRESS, INITIAL_STATS } from "../data/stats.js";

export const SAVE_KEY = "research-road-save-v4";
export const LEGACY_SAVE_KEYS = ["research-road-save-v1", "research-road-save-v2", "research-road-save-v3"];
export const SAVE_SLOTS_KEY = "research-road-save-slots-v1";
export const ACTIVE_SAVE_SLOT_KEY = "research-road-active-slot-v1";
export const SAVE_SLOT_COUNT = 3;
export const MAX_LOGS = 80;
export const DEFAULT_PROFILE = {
  name: "未命名",
  gender: "undisclosed",
};

const START_LOG = "高三开始了。你把目标写在便签上：先考上一所好大学。";

export function limitLogs(logs) {
  return logs.slice(0, MAX_LOGS);
}

export function appendLogs(game, logs) {
  return {
    ...game,
    logs: limitLogs([...logs, ...(game.logs ?? [])]),
  };
}

export function getStageIndex(stageId) {
  return STAGES.findIndex((stage) => stage.id === stageId);
}

export function getStage(game) {
  return STAGES[game.stageIndex] ?? STAGES[0];
}

export function isFinalStage(game) {
  return game.stageIndex === STAGES.length - 1;
}

function getStageStartAge(stageIndex) {
  return STAGES.slice(0, Math.max(0, stageIndex)).reduce((age, stage) => age + (stage.years ?? 1), 17);
}

function normalizeStageIndex(saved) {
  const rawStageIndex = Number.isInteger(saved.stageIndex) ? saved.stageIndex : 0;
  const hasAge = Number.isFinite(saved.age);

  if (!hasAge) {
    if (rawStageIndex === 5) return getStageIndex("professor");
    if (rawStageIndex === 6) return getStageIndex("academician_candidate");
  }

  return STAGES[rawStageIndex] ? rawStageIndex : 0;
}

export function shouldShowEnding(game) {
  return Boolean(game.ending) && isFinalStage(game) && !game.pendingGraduateChoice;
}

export function createInitialGame(overrides = {}) {
  return {
    screen: "intro",
    profile: { ...DEFAULT_PROFILE },
    stageIndex: 0,
    turn: 1,
    ap: STAGES[0].ap,
    age: 17,
    stats: { ...INITIAL_STATS },
    progress: { ...INITIAL_PROGRESS },
    usedEvents: [],
    activeEvent: null,
    pendingGraduateChoice: false,
    pendingAdvance: false,
    ending: null,
    papers: [],
    actionUses: {},
    flags: {},
    logs: [START_LOG],
    ...overrides,
  };
}

export function createSaveSlot(id, game = null) {
  return {
    id,
    name: `存档 ${id}`,
    updatedAt: game ? new Date().toISOString() : null,
    game,
  };
}

export function createEmptySaveSlots() {
  return Array.from({ length: SAVE_SLOT_COUNT }, (_, index) => createSaveSlot(index + 1));
}

export function normalizeSaveSlots(rawSlots) {
  const byId = new Map();
  if (Array.isArray(rawSlots)) {
    rawSlots.forEach((slot) => {
      if (!slot || !Number.isInteger(slot.id)) return;
      byId.set(slot.id, {
        id: slot.id,
        name: slot.name || `存档 ${slot.id}`,
        updatedAt: slot.updatedAt ?? null,
        game: slot.game ? normalizeSavedGame(slot.game) : null,
      });
    });
  }

  return createEmptySaveSlots().map((slot) => byId.get(slot.id) ?? slot);
}

export function saveGameToSlot(slots, slotId, game) {
  return normalizeSaveSlots(slots).map((slot) =>
    slot.id === slotId
      ? {
          ...slot,
          updatedAt: new Date().toISOString(),
          game: normalizeSavedGame(game),
        }
      : slot,
  );
}

export function clearSaveSlot(slots, slotId) {
  return normalizeSaveSlots(slots).map((slot) => (slot.id === slotId ? createSaveSlot(slotId) : slot));
}

export function normalizeSavedGame(saved) {
  if (!saved || typeof saved !== "object") return createInitialGame();

  const base = createInitialGame();
  const stageIndex = normalizeStageIndex(saved);
  const stage = STAGES[stageIndex];
  const fallbackAge = getStageStartAge(stageIndex);
  const next = {
    ...base,
    ...saved,
    profile: normalizeProfile(saved.profile),
    stageIndex,
    turn: Number.isInteger(saved.turn) ? Math.max(1, Math.min(saved.turn, stage.turns)) : base.turn,
    ap: Number.isFinite(saved.ap) ? Math.max(0, saved.ap) : base.ap,
    age: Number.isFinite(saved.age) ? Math.max(16, Math.min(80, saved.age)) : fallbackAge,
    stats: { ...INITIAL_STATS, ...(saved.stats ?? {}) },
    progress: { ...INITIAL_PROGRESS, ...(saved.progress ?? {}) },
    usedEvents: Array.isArray(saved.usedEvents) ? saved.usedEvents : [],
    activeEvent: saved.activeEvent ?? null,
    pendingGraduateChoice: Boolean(saved.pendingGraduateChoice),
    pendingAdvance: Boolean(saved.pendingAdvance),
    ending: saved.ending ?? null,
    papers: Array.isArray(saved.papers) ? saved.papers : [],
    actionUses: saved.actionUses && typeof saved.actionUses === "object" ? saved.actionUses : {},
    flags: saved.flags && typeof saved.flags === "object" ? saved.flags : {},
    logs: Array.isArray(saved.logs) ? limitLogs(saved.logs) : base.logs,
  };

  if (next.ending?.id === "industry_route") {
    const undergraduateIndex = getStageIndex("undergraduate");
    return appendLogs(
      {
        ...next,
        stageIndex: undergraduateIndex,
        turn: STAGES[undergraduateIndex].turns,
        ap: 0,
        ending: null,
        pendingGraduateChoice: true,
        pendingAdvance: false,
      },
      ["存档修复：旧版本的本科产业结局已改为读研去向选择。"],
    );
  }

  if (!shouldShowEnding(next) && next.ending) {
    return appendLogs({ ...next, ending: null }, ["存档修复：移除了非终局阶段残留的结局状态。"]);
  }

  return next;
}

function normalizeProfile(profile) {
  if (!profile || typeof profile !== "object") return { ...DEFAULT_PROFILE };

  const name = typeof profile.name === "string" && profile.name.trim() ? profile.name.trim().slice(0, 12) : DEFAULT_PROFILE.name;
  const gender = ["male", "female", "undisclosed"].includes(profile.gender) ? profile.gender : DEFAULT_PROFILE.gender;
  return { name, gender };
}
