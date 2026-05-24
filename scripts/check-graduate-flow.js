import assert from "node:assert/strict";
import { STAGES } from "../src/data/stages.js";
import { settleStage } from "../src/game/engine.js";
import { createInitialGame, getStageIndex, normalizeSavedGame, shouldShowEnding } from "../src/game/state.js";

const undergraduateIndex = getStageIndex("undergraduate");
const masterIndex = getStageIndex("master");

assert.notEqual(undergraduateIndex, -1);
assert.notEqual(masterIndex, -1);

const undergraduateGame = createInitialGame({
  screen: "play",
  stageIndex: undergraduateIndex,
  turn: STAGES[undergraduateIndex].turns,
  ap: 0,
  stats: {
    ...createInitialGame().stats,
    knowledge: 80,
    focus: 75,
    perseverance: 80,
    reputation: 35,
    literature: 40,
    writing: 40,
    money: 40,
    eq: 55,
  },
  progress: {
    ...createInitialGame().progress,
    gpa: 90,
    research: 88,
  },
});

const settled = settleStage(undergraduateGame);
assert.equal(settled.ending, null);
assert.equal(settled.pendingGraduateChoice, false);
assert.equal(settled.stageIndex, masterIndex);
assert.equal(shouldShowEnding(settled), false);

const migrated = normalizeSavedGame({
  ...undergraduateGame,
  pendingGraduateChoice: true,
  ending: { id: "industry_route", title: "先去产业研发", text: "legacy" },
});
assert.equal(migrated.ending, null);
assert.equal(migrated.pendingGraduateChoice, false);
assert.equal(migrated.stageIndex, masterIndex);
assert.equal(shouldShowEnding(migrated), false);

console.log("本科到硕士流程检查通过：本科毕业直接进入硕士阶段。");
