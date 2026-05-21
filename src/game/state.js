import { STAGES } from "../data/stages.js";
import { INITIAL_PROGRESS, INITIAL_STATS } from "../data/stats.js";

export const SAVE_KEY = "research-road-save-v4";
export const LEGACY_SAVE_KEYS = ["research-road-save-v1", "research-road-save-v2", "research-road-save-v3"];
export const MAX_LOGS = 80;

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

export function shouldShowEnding(game) {
  return Boolean(game.ending) && isFinalStage(game) && !game.pendingGraduateChoice;
}

export function createInitialGame(overrides = {}) {
  return {
    screen: "intro",
    stageIndex: 0,
    turn: 1,
    ap: STAGES[0].ap,
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

export function normalizeSavedGame(saved) {
  if (!saved || typeof saved !== "object") return createInitialGame();

  const base = createInitialGame();
  const stageIndex = Number.isInteger(saved.stageIndex) && STAGES[saved.stageIndex] ? saved.stageIndex : 0;
  const stage = STAGES[stageIndex];
  const next = {
    ...base,
    ...saved,
    stageIndex,
    turn: Number.isInteger(saved.turn) ? Math.max(1, Math.min(saved.turn, stage.turns)) : base.turn,
    ap: Number.isFinite(saved.ap) ? Math.max(0, saved.ap) : base.ap,
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
