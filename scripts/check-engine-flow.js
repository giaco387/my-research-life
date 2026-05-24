import assert from "node:assert/strict";
import { ACTIONS } from "../src/data/actions.js";
import { STAGES } from "../src/data/stages.js";
import { advanceTurn, performAction, settleStage } from "../src/game/engine.js";
import { createInitialGame, getStageIndex, normalizeSavedGame, shouldShowEnding } from "../src/game/state.js";

const highSchoolIndex = getStageIndex("high_school");
const undergraduateIndex = getStageIndex("undergraduate");
const masterIndex = getStageIndex("master");
const finalIndex = STAGES.length - 1;

let game = createInitialGame({ screen: "play" });
assert.equal(game.stageIndex, highSchoolIndex);
assert.equal(shouldShowEnding(game), false);

game = {
  ...game,
  stageIndex: undergraduateIndex,
  turn: STAGES[undergraduateIndex].turns,
  ap: 0,
  progress: { ...game.progress, gpa: 80, research: 80 },
  stats: { ...game.stats, reputation: 30, literature: 35 },
};

game = settleStage(game);
assert.equal(game.pendingGraduateChoice, false);
assert.equal(game.ending, null);
assert.equal(shouldShowEnding(game), false);
assert.equal(game.stageIndex, masterIndex);

const masterAction = ACTIONS.master.find((action) => action.id === "read");
const afterAction = performAction({ ...game, ap: masterAction.cost }, masterAction, () => 0);
assert.ok(afterAction.progress.project > game.progress.project);
assert.equal(shouldShowEnding(afterAction), false);

const invalidEnding = normalizeSavedGame({
  ...createInitialGame({ screen: "play" }),
  stageIndex: undergraduateIndex,
  ending: { id: "steady", title: "平凡但完整", text: "invalid stale ending" },
});
assert.equal(invalidEnding.ending, null);
assert.equal(shouldShowEnding(invalidEnding), false);

const finalGame = {
  ...createInitialGame({ screen: "play" }),
  stageIndex: finalIndex,
  turn: STAGES[finalIndex].turns,
  ap: 0,
};
const ended = advanceTurn(finalGame, { allowEvent: false });
assert.ok(ended.ending);
assert.equal(shouldShowEnding(ended), true);

console.log("核心状态机检查通过。");
