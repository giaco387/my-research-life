import { STAGES } from "../data/stages.js";
import { INITIAL_PROGRESS, INITIAL_STATS } from "../data/stats.js";

export const SAVE_KEY = "research-road-save-v4";
export const LEGACY_SAVE_KEYS = ["research-road-save-v1", "research-road-save-v2", "research-road-save-v3"];
export const SAVE_SLOTS_KEY = "research-road-save-slots-v1";
export const ACTIVE_SAVE_SLOT_KEY = "research-road-active-slot-v1";
export const SAVE_SLOT_COUNT = 3;
export const MAX_LOGS = 80;
export const DEFAULT_PROFILE = {
  name: "子涵",
  gender: "male",
  background: "steady",
};
export const DEFAULT_CAREER = {
  maritalStatus: "未婚",
  children: 0,
  mentor: "暂无",
  students: {
    master: 0,
    phd: 0,
    postdoc: 0,
  },
  faculty: {
    lecturer: 0,
    associateProfessor: 0,
    professor: 0,
  },
  selfTitles: [],
  teamTitles: {
    youqing: 0,
    jieqing: 0,
    changjiangYoung: 0,
    changjiangProfessor: 0,
  },
  grants: {
    applications: 0,
    funded: 0,
    youth: 0,
    general: 0,
    key: 0,
    major: 0,
  },
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
  return Boolean(game.ending) && isFinalStage(game);
}

export function createInitialGame(overrides = {}) {
  return {
    screen: "intro",
    profile: { ...DEFAULT_PROFILE },
    career: normalizeCareer(),
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
    career: normalizeCareer(saved.career),
    stageIndex,
    turn: Number.isInteger(saved.turn) ? Math.max(1, Math.min(saved.turn, stage.turns)) : base.turn,
    ap: Number.isFinite(saved.ap) ? Math.max(0, saved.ap) : base.ap,
    age: Number.isFinite(saved.age) ? Math.max(16, Math.min(80, saved.age)) : fallbackAge,
    stats: { ...INITIAL_STATS, ...(saved.stats ?? {}) },
    progress: { ...INITIAL_PROGRESS, ...(saved.progress ?? {}) },
    usedEvents: Array.isArray(saved.usedEvents) ? saved.usedEvents : [],
    activeEvent: saved.activeEvent ?? null,
    pendingGraduateChoice: false,
    pendingAdvance: Boolean(saved.pendingAdvance),
    ending: saved.ending ?? null,
    papers: Array.isArray(saved.papers) ? saved.papers : [],
    actionUses: saved.actionUses && typeof saved.actionUses === "object" ? saved.actionUses : {},
    flags: saved.flags && typeof saved.flags === "object" ? saved.flags : {},
    logs: Array.isArray(saved.logs) ? limitLogs(saved.logs) : base.logs,
  };

  if (next.ending?.id === "industry_route") {
    const masterIndex = getStageIndex("master");
    return appendLogs(
      {
        ...next,
        stageIndex: masterIndex,
        turn: 1,
        ap: STAGES[masterIndex].ap,
        ending: null,
        pendingGraduateChoice: false,
        pendingAdvance: false,
      },
      ["存档修复：旧版本的本科分支已直接接入硕士阶段。"],
    );
  }

  if (!shouldShowEnding(next) && next.ending) {
    return appendLogs({ ...next, ending: null }, ["存档修复：移除了非终局阶段残留的结局状态。"]);
  }

  return next;
}

export function applyCareerEffects(career, effects = {}) {
  const next = normalizeCareer(career);
  if (!effects || typeof effects !== "object") return next;

  if (typeof effects.maritalStatus === "string") next.maritalStatus = effects.maritalStatus;
  if (typeof effects.mentor === "string") next.mentor = effects.mentor;
  if (Number.isFinite(effects.childrenDelta)) {
    next.children = clampCareerNumber(next.children + effects.childrenDelta, 0, 8);
  }

  applyNestedDeltas(next.students, effects.studentDeltas, 0, 80);
  applyNestedDeltas(next.faculty, effects.facultyDeltas, 0, 60);
  applyNestedDeltas(next.teamTitles, effects.teamTitleDeltas, 0, 30);
  applyNestedDeltas(next.grants, effects.grantDeltas, 0, 999);

  if (Array.isArray(effects.addSelfTitles)) {
    next.selfTitles = Array.from(new Set([...next.selfTitles, ...effects.addSelfTitles])).slice(0, 12);
  }
  if (Array.isArray(effects.removeSelfTitles)) {
    const removals = new Set(effects.removeSelfTitles);
    next.selfTitles = next.selfTitles.filter((title) => !removals.has(title));
  }

  return normalizeCareer(next);
}

export function normalizeCareer(career = {}) {
  return {
    maritalStatus: typeof career.maritalStatus === "string" ? career.maritalStatus : DEFAULT_CAREER.maritalStatus,
    children: clampCareerNumber(career.children, 0, 8),
    mentor: typeof career.mentor === "string" && career.mentor.trim() ? career.mentor.trim().slice(0, 20) : DEFAULT_CAREER.mentor,
    students: normalizeCareerGroup(DEFAULT_CAREER.students, career.students, 80),
    faculty: normalizeCareerGroup(DEFAULT_CAREER.faculty, career.faculty, 60),
    selfTitles: Array.isArray(career.selfTitles) ? career.selfTitles.filter((item) => typeof item === "string").slice(0, 12) : [],
    teamTitles: normalizeCareerGroup(DEFAULT_CAREER.teamTitles, career.teamTitles, 30),
    grants: normalizeCareerGroup(DEFAULT_CAREER.grants, career.grants, 999),
  };
}

function normalizeProfile(profile) {
  if (!profile || typeof profile !== "object") return { ...DEFAULT_PROFILE };

  const name = typeof profile.name === "string" && profile.name.trim() ? profile.name.trim().slice(0, 12) : DEFAULT_PROFILE.name;
  const gender = ["male", "female"].includes(profile.gender) ? profile.gender : DEFAULT_PROFILE.gender;
  const background = typeof profile.background === "string" && profile.background.trim() ? profile.background.trim().slice(0, 24) : DEFAULT_PROFILE.background;
  return { name, gender, background };
}

function normalizeCareerGroup(defaults, values = {}, max = 999) {
  return Object.fromEntries(
    Object.entries(defaults).map(([key, value]) => [key, clampCareerNumber(values?.[key] ?? value, 0, max)]),
  );
}

function applyNestedDeltas(target, deltas = {}, min = 0, max = 999) {
  Object.entries(deltas ?? {}).forEach(([key, value]) => {
    if (!Number.isFinite(value) || target[key] === undefined) return;
    target[key] = clampCareerNumber(target[key] + value, min, max);
  });
}

function clampCareerNumber(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}
