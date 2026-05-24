import { ACTIONS } from "../src/data/actions.js";
import { GRADUATE_ROUTES } from "../src/data/graduateRoutes.js";
import { chooseEvent, chooseGraduateRoute, performAction, advanceTurn, canPerformAction } from "../src/game/engine.js";
import { createInitialGame, getStage, shouldShowEnding } from "../src/game/state.js";

const runs = Number(process.argv[2] ?? 1000);

function chooseAction(game) {
  if (Math.random() < 0.62) return null;
  const stage = getStage(game);
  const candidates = (ACTIONS[stage.id] ?? []).filter((action) => canPerformAction(game, action));
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function chooseRoute(game) {
  const scored = GRADUATE_ROUTES.map((route) => {
    const value =
      route.id === "direct_phd"
        ? game.progress.research + game.stats.reputation + game.stats.literature
        : route.id === "recommended_master"
          ? game.progress.gpa + game.progress.research
          : route.id === "overseas_phd"
            ? game.progress.research + game.stats.writing + game.stats.money
            : route.id === "work_then_master"
              ? game.stats.money + game.stats.eq
              : game.stats.knowledge + game.stats.perseverance;
    return { route, value };
  });
  scored.sort((a, b) => b.value - a.value);
  return scored[0].route;
}

function runOne() {
  let game = createInitialGame({ screen: "play" });

  for (let guard = 0; guard < 1000; guard += 1) {
    if (game.activeEvent) {
      const choices = game.activeEvent.choices;
      game = chooseEvent(game, choices[Math.floor(Math.random() * choices.length)]);
    } else if (game.pendingGraduateChoice) {
      game = chooseGraduateRoute(game, chooseRoute(game));
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
