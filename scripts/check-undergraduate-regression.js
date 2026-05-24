import assert from "node:assert/strict";
import { ACTIONS } from "../src/data/actions.js";
import { advanceTurn, canPerformAction, chooseEvent, performAction } from "../src/game/engine.js";
import { createInitialGame, getStage, shouldShowEnding } from "../src/game/state.js";

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

for (let seed = 1; seed <= 500; seed += 1) {
  const random = mulberry32(seed);
  let game = createInitialGame({ screen: "play" });

  for (let guard = 0; guard < 400; guard += 1) {
    if (game.pendingGraduateChoice) {
      assert.equal(getStage(game).id, "undergraduate", `seed ${seed}: graduate choice should happen at undergraduate`);
      assert.equal(game.ending, null, `seed ${seed}: undergraduate graduation must not set ending`);
      assert.equal(shouldShowEnding(game), false, `seed ${seed}: undergraduate graduation must not show ending`);
      break;
    }

    assert.equal(shouldShowEnding(game), false, `seed ${seed}: ending appeared before graduate choice`);

    if (game.activeEvent) {
      const choices = game.activeEvent.choices;
      game = chooseEvent(game, choices[Math.floor(random() * choices.length)]);
    } else {
      const action = chooseAction(game, random);
      game = action ? performAction(game, action, random) : advanceTurn(game, { random });
    }
  }

  assert.equal(game.pendingGraduateChoice, true, `seed ${seed}: did not reach graduate choice`);
}

console.log("本科毕业回归检查通过：完整游玩到本科结束不会直接结局。");
