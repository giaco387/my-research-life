import { ACTIONS } from "../src/data/actions.js";
import { chooseEvent, performAction, advanceTurn, canPerformAction } from "../src/game/engine.js";
import { createInitialGame, getStage, shouldShowEnding } from "../src/game/state.js";

const runs = Number(process.argv[2] ?? 1000);

function chooseAction(game) {
  if (Math.random() < 0.62) return null;
  const stage = getStage(game);
  const candidates = (ACTIONS[stage.id] ?? []).filter((action) => canPerformAction(game, action));
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function runOne() {
  let game = createInitialGame({ screen: "play" });

  for (let guard = 0; guard < 1000; guard += 1) {
    if (game.activeEvent) {
      const choices = game.activeEvent.choices;
      game = chooseEvent(game, choices[Math.floor(Math.random() * choices.length)]);
    } else if (shouldShowEnding(game)) {
      return game.ending.title;
    } else {
      const action = chooseAction(game);
      game = action ? performAction(game, action) : advanceTurn(game);
    }
  }

  return "模拟超时";
}

const summary = new Map();

for (let index = 0; index < runs; index += 1) {
  const ending = runOne();
  summary.set(ending, (summary.get(ending) ?? 0) + 1);
}

console.log(`模拟局数: ${runs}`);
for (const [ending, count] of [...summary.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`${ending}: ${count} (${((count / runs) * 100).toFixed(1)}%)`);
}
