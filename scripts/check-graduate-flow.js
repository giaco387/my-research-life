import assert from "node:assert/strict";
import { GRADUATE_ROUTES } from "../src/data/graduateRoutes.js";
import { STAGES } from "../src/data/stages.js";
import { chooseGraduateRoute, settleStage } from "../src/game/engine.js";
import { createInitialGame, getStageIndex, normalizeSavedGame, shouldShowEnding } from "../src/game/state.js";

const undergraduateIndex = getStageIndex("undergraduate");
const masterIndex = getStageIndex("master");
const phdIndex = getStageIndex("phd");

assert.notEqual(undergraduateIndex, -1);
assert.notEqual(masterIndex, -1);
assert.notEqual(phdIndex, -1);

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
assert.equal(settled.pendingGraduateChoice, true);
assert.equal(shouldShowEnding(settled), false);

for (const route of GRADUATE_ROUTES) {
  const routed = chooseGraduateRoute(settled, route, () => 0);
  assert.equal(
    shouldShowEnding(routed),
    false,
    `${route.name} should not show an ending immediately after undergraduate graduation`,
  );
  assert.ok(
    routed.stageIndex === masterIndex || routed.stageIndex === phdIndex,
    `${route.name} should continue into master or phd, got stage index ${routed.stageIndex}`,
  );
}

const migrated = normalizeSavedGame({
  ...undergraduateGame,
  ending: { id: "industry_route", title: "先去产业研发", text: "legacy" },
});
assert.equal(migrated.ending, null);
assert.equal(migrated.pendingGraduateChoice, true);
assert.equal(shouldShowEnding(migrated), false);

console.log("读研流程检查通过：本科毕业不会直接触发或显示结局。");
