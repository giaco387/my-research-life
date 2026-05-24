import assert from "node:assert/strict";
import { ACTIONS } from "../src/data/actions.js";
import { advanceTurn, canPerformAction, chooseEvent, performAction } from "../src/game/engine.js";
import { createInitialGame, getStage, getStageIndex, shouldShowEnding } from "../src/game/state.js";

function mulberry32(seed) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function chooseAction(game, random) {
  const stage = getStage(game);
  const candidates = (ACTIONS[stage.id] ?? []).filter((action) => canPerformAction(game, action));
  if (!candidates.length) return null;
  return candidates[Math.floor(random() * candidates.length)];
}

const masterIndex = getStageIndex("master");

for (let seed = 1; seed <= 500; seed += 1) {
  const random = mulberry32(seed);
  let game = createInitialGame({ screen: "play" });

  for (let guard = 0; guard < 400; guard += 1) {
    assert.equal(game.pendingGraduateChoice, false, `seed ${seed}: graduate route choice should not appear`);
    assert.equal(shouldShowEnding(game), false, `seed ${seed}: ending appeared before master stage`);

    if (getStage(game).id === "master") break;

    if (game.activeEvent) {
      const choices = game.activeEvent.choices;
      game = chooseEvent(game, choices[Math.floor(random() * choices.length)]);
    } else {
      const action = chooseAction(game, random);
      game = action ? performAction(game, action, random) : advanceTurn(game, { random });
    }
  }

  assert.equal(game.stageIndex, masterIndex, `seed ${seed}: did not reach master directly after undergraduate`);
}

console.log("本科毕业回归检查通过：完整游玩到本科后直接进入硕士。");
