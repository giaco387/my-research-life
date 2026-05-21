import { ACTIONS } from "../src/data/actions.js";
import { GRADUATE_ROUTES } from "../src/data/graduateRoutes.js";
import { chooseEvent, chooseGraduateRoute, performAction, advanceTurn, canPerformAction } from "../src/game/engine.js";
import { createInitialGame, getStage, shouldShowEnding } from "../src/game/state.js";

const runs = Number(process.argv[2] ?? 500);

const STRATEGIES = {
  random: {
    name: "随机玩家",
    weights: {},
    recoveryPressure: 92,
    routeBias: {},
  },
  balanced: {
    name: "普通认真玩家",
    priorities: {
      high_school: ["mock", "study", "teacher", "sleep", "exercise", "friends"],
      undergraduate: ["lab", "class", "library", "competition", "social", "rest", "intern"],
      master: ["read", "experiment", "write", "submit", "meeting", "recover", "conference"],
      phd: ["deep_topic", "long_experiment", "paper_sprint", "journal_submit", "mentor_junior", "mental_break", "visit"],
      young_faculty: ["grant", "recruit", "platform", "representative", "teach", "recover"],
      professor: ["major_grant", "train_phd", "breakthrough", "team_papers", "award", "community", "recover"],
      academician_candidate: ["summarize", "peer_support", "talent_record", "ethics", "public_impact", "recover"],
    },
    weights: {
      knowledge: 1.2,
      perseverance: 1,
      focus: 1.1,
      health: 1.1,
      pressure: -1.1,
      eq: 0.9,
      money: 0.4,
      reputation: 1.1,
      literature: 1.2,
      experiment: 1.2,
      writing: 1.2,
      innovation: 1.2,
      network: 1,
      contribution: 1.4,
      gpa: 1.2,
      research: 1.3,
      project: 1.2,
      paper: 1.5,
      dissertation: 1.5,
      originality: 1.6,
      fund: 1.2,
      team: 1.2,
      majorProject: 1.2,
      talent: 1.2,
      academyReview: 1.3,
      acceptedPapers: 1.4,
      highImpactPapers: 1.8,
      representativeWorks: 2,
      nationalAwards: 1.6,
      strategicContribution: 1.5,
    },
    recoveryPressure: 68,
    routeBias: { recommended_master: 8, direct_phd: 3, overseas_phd: 2, work_then_master: 1 },
  },
  paper: {
    name: "论文优先玩家",
    priorities: {
      high_school: ["study", "mock", "teacher", "sleep", "exercise", "friends"],
      undergraduate: ["library", "lab", "competition", "class", "rest", "social", "intern"],
      master: ["read", "experiment", "write", "submit", "recover", "meeting", "conference"],
      phd: ["deep_topic", "long_experiment", "paper_sprint", "journal_submit", "mental_break", "visit", "mentor_junior"],
      young_faculty: ["grant", "representative", "platform", "recruit", "recover", "teach"],
      professor: ["breakthrough", "team_papers", "major_grant", "award", "recover", "train_phd", "community"],
      academician_candidate: ["summarize", "ethics", "peer_support", "public_impact", "talent_record", "recover"],
    },
    weights: {
      health: 0.4,
      pressure: -0.45,
      reputation: 1.2,
      literature: 1.8,
      experiment: 1.7,
      writing: 2,
      innovation: 1.8,
      contribution: 1.7,
      paper: 2.2,
      dissertation: 2,
      originality: 1.8,
      acceptedPapers: 2.2,
      highImpactPapers: 2.8,
      representativeWorks: 3,
      academyReview: 1.4,
    },
    recoveryPressure: 78,
    routeBias: { direct_phd: 8, overseas_phd: 5, recommended_master: 3 },
  },
  prestige: {
    name: "声望资源玩家",
    priorities: {
      high_school: ["teacher", "mock", "study", "friends", "sleep", "exercise"],
      undergraduate: ["social", "lab", "competition", "library", "class", "intern", "rest"],
      master: ["conference", "meeting", "read", "write", "submit", "experiment", "recover"],
      phd: ["visit", "paper_sprint", "mentor_junior", "deep_topic", "journal_submit", "mental_break", "long_experiment"],
      young_faculty: ["grant", "recruit", "representative", "teach", "platform", "recover"],
      professor: ["community", "major_grant", "train_phd", "award", "team_papers", "breakthrough", "recover"],
      academician_candidate: ["peer_support", "public_impact", "talent_record", "summarize", "ethics", "recover"],
    },
    weights: {
      health: 0.6,
      pressure: -0.55,
      eq: 1.2,
      money: 0.8,
      reputation: 2.2,
      network: 2,
      contribution: 1.5,
      fund: 1.6,
      team: 1.4,
      majorProject: 1.8,
      talent: 1.6,
      academyReview: 2,
      acceptedPapers: 1.4,
      highImpactPapers: 1.8,
      representativeWorks: 2,
      nationalAwards: 2,
      strategicContribution: 1.8,
    },
    recoveryPressure: 76,
    routeBias: { recommended_master: 7, overseas_phd: 4, direct_phd: 2 },
  },
  healthy: {
    name: "健康优先玩家",
    priorities: {
      high_school: ["sleep", "exercise", "teacher", "study", "mock", "friends"],
      undergraduate: ["rest", "class", "library", "social", "lab", "intern", "competition"],
      master: ["recover", "read", "meeting", "write", "experiment", "submit", "conference"],
      phd: ["mental_break", "deep_topic", "mentor_junior", "paper_sprint", "visit", "journal_submit", "long_experiment"],
      young_faculty: ["recover", "teach", "recruit", "grant", "platform", "representative"],
      professor: ["recover", "community", "train_phd", "major_grant", "team_papers", "award", "breakthrough"],
      academician_candidate: ["recover", "ethics", "talent_record", "peer_support", "public_impact", "summarize"],
    },
    weights: {
      health: 2.4,
      pressure: -2.2,
      focus: 1.2,
      perseverance: 1,
      eq: 1,
      reputation: 0.8,
      contribution: 0.8,
      paper: 0.9,
      dissertation: 0.9,
      team: 0.9,
      talent: 1,
    },
    recoveryPressure: 52,
    routeBias: { exam_master: 4, recommended_master: 4, work_then_master: 4 },
  },
  industry: {
    name: "产业倾向玩家",
    priorities: {
      high_school: ["teacher", "study", "sleep", "mock", "friends", "exercise"],
      undergraduate: ["intern", "social", "lab", "class", "library", "rest", "competition"],
      master: ["conference", "experiment", "meeting", "read", "recover", "write", "submit"],
      phd: ["visit", "mentor_junior", "paper_sprint", "deep_topic", "mental_break", "journal_submit", "long_experiment"],
      young_faculty: ["platform", "recruit", "teach", "grant", "recover", "representative"],
      professor: ["community", "major_grant", "train_phd", "team_papers", "recover", "award", "breakthrough"],
      academician_candidate: ["public_impact", "peer_support", "talent_record", "ethics", "recover", "summarize"],
    },
    weights: {
      health: 1,
      pressure: -1.2,
      eq: 1.8,
      money: 2.4,
      experiment: 1.4,
      network: 1.4,
      reputation: 0.8,
      project: 1,
      strategicContribution: 1,
    },
    recoveryPressure: 65,
    routeBias: { work_then_master: 16, exam_master: 3 },
  },
  academy: {
    name: "冲院士玩家",
    priorities: {
      high_school: ["mock", "study", "teacher", "sleep", "exercise", "friends"],
      undergraduate: ["lab", "competition", "library", "class", "social", "rest", "intern"],
      master: ["read", "experiment", "write", "submit", "conference", "meeting", "recover"],
      phd: ["deep_topic", "long_experiment", "paper_sprint", "journal_submit", "visit", "mentor_junior", "mental_break"],
      young_faculty: ["grant", "recruit", "platform", "representative", "teach", "recover"],
      professor: ["major_grant", "breakthrough", "team_papers", "train_phd", "award", "community", "recover"],
      academician_candidate: ["summarize", "peer_support", "talent_record", "public_impact", "ethics", "recover"],
    },
    weights: {
      health: 0.8,
      pressure: -0.8,
      eq: 1,
      reputation: 2.4,
      literature: 1.8,
      experiment: 1.7,
      writing: 1.8,
      innovation: 2.2,
      network: 2.1,
      contribution: 2.4,
      paper: 1.8,
      dissertation: 2,
      originality: 2.4,
      fund: 2,
      team: 1.7,
      majorProject: 2.4,
      talent: 2,
      academyReview: 2.8,
      acceptedPapers: 2,
      highImpactPapers: 2.8,
      representativeWorks: 3,
      nationalAwards: 2.6,
      strategicContribution: 2.6,
    },
    recoveryPressure: 72,
    routeBias: { direct_phd: 12, overseas_phd: 6, recommended_master: 4 },
  },
};

function mulberry32(seed) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function evaluateDelta(delta = {}, weights = {}) {
  return Object.entries(delta).reduce((sum, [key, value]) => sum + value * (weights[key] ?? 0), 0);
}

function actionScore(game, action, strategy, random) {
  const stage = getStage(game);
  const weights = strategy.weights;
  let score = evaluateDelta(action.effects, weights) + evaluateDelta(action.progress, weights);

  if (action.id.includes("recover") || action.id.includes("rest") || action.id.includes("sleep") || action.id.includes("mental_break")) {
    score += Math.max(0, game.stats.pressure - strategy.recoveryPressure) * 1.4;
    score += Math.max(0, 45 - game.stats.health) * 1.2;
  }

  if (action.system === "paper_submission") {
    score += (weights.acceptedPapers ?? 0) * 1.5 + (weights.highImpactPapers ?? 0) + (weights.representativeWorks ?? 0);
  }

  if (action.risk) {
    score += action.risk.chance * (evaluateDelta(action.risk.effects, weights) + evaluateDelta(action.risk.progress, weights));
  }

  if (stage.id === "academician_candidate") score += evaluateDelta(action.progress, { academyReview: 1.8 });
  return score / action.cost + random() * 0.4;
}

function chooseAction(game, strategy, random) {
  const stage = getStage(game);
  const candidates = (ACTIONS[stage.id] ?? []).filter((action) => canPerformAction(game, action));
  if (!candidates.length) return null;
  if (strategy === STRATEGIES.random) {
    if (random() < 0.62) return null;
    return candidates[Math.floor(random() * candidates.length)];
  }

  if (game.stats.pressure >= strategy.recoveryPressure || game.stats.health <= 38) {
    const recovery = candidates.find((action) =>
      action.id.includes("recover") || action.id.includes("rest") || action.id.includes("sleep") || action.id.includes("mental_break"),
    );
    if (recovery) return recovery;
  }

  const priorities = strategy.priorities?.[stage.id] ?? [];
  for (const actionId of priorities) {
    const action = candidates.find((candidate) => candidate.id === actionId);
    if (action) return action;
  }

  return candidates
    .map((action) => ({ action, score: actionScore(game, action, strategy, random) }))
    .sort((a, b) => b.score - a.score)[0].action;
}

function chooseEventOption(event, strategy, random) {
  if (strategy === STRATEGIES.random) return event.choices[Math.floor(random() * event.choices.length)];
  return event.choices
    .map((choice) => ({
      choice,
      score: evaluateDelta(choice.effects, strategy.weights) + evaluateDelta(choice.progress, strategy.weights) + random() * 0.2,
    }))
    .sort((a, b) => b.score - a.score)[0].choice;
}

function chooseRoute(game, strategy, random) {
  if (strategy === STRATEGIES.random) return GRADUATE_ROUTES[Math.floor(random() * GRADUATE_ROUTES.length)];
  return GRADUATE_ROUTES
    .map((route) => {
      const score =
        evaluateDelta(route.successEffects, strategy.weights) +
        evaluateDelta(route.successProgress, strategy.weights) +
        (strategy.routeBias[route.id] ?? 0) +
        random() * 0.4;
      return { route, score };
    })
    .sort((a, b) => b.score - a.score)[0].route;
}

function summarizeFinal(game) {
  const p = game.progress;
  const s = game.stats;
  return {
    reputation: s.reputation,
    contribution: s.contribution,
    pressure: s.pressure,
    health: s.health,
    eq: s.eq,
    money: s.money,
    experiment: s.experiment,
    network: s.network,
    acceptedPapers: p.acceptedPapers,
    highImpactPapers: p.highImpactPapers,
    representativeWorks: p.representativeWorks,
    nationalAwards: p.nationalAwards,
    majorProject: p.majorProject,
    talent: p.talent,
    strategicContribution: p.strategicContribution,
    academyReview: p.academyReview,
  };
}

function runOne(strategy, seed) {
  const random = mulberry32(seed);
  let game = createInitialGame({ screen: "play" });

  for (let guard = 0; guard < 1000; guard += 1) {
    if (game.activeEvent) {
      game = chooseEvent(game, chooseEventOption(game.activeEvent, strategy, random));
    } else if (game.pendingGraduateChoice) {
      game = chooseGraduateRoute(game, chooseRoute(game, strategy, random), random);
    } else if (shouldShowEnding(game)) {
      return { ending: game.ending.title, final: summarizeFinal(game) };
    } else {
      const action = chooseAction(game, strategy, random);
      game = action ? performAction(game, action, random) : advanceTurn(game, { random });
    }
  }

  return { ending: "模拟超时", final: summarizeFinal(game) };
}

function addAverages(target, final) {
  for (const [key, value] of Object.entries(final)) {
    target[key] = (target[key] ?? 0) + value;
  }
}

function printStrategy(strategyKey, offset) {
  const strategy = STRATEGIES[strategyKey];
  const summary = new Map();
  const averages = {};

  for (let index = 0; index < runs; index += 1) {
    const result = runOne(strategy, offset + index * 97);
    summary.set(result.ending, (summary.get(result.ending) ?? 0) + 1);
    addAverages(averages, result.final);
  }

  console.log(`\n${strategy.name}（${runs}局）`);
  for (const [ending, count] of [...summary.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${ending}: ${count} (${((count / runs) * 100).toFixed(1)}%)`);
  }
  const averageText = Object.entries(averages)
    .map(([key, value]) => `${key}=${(value / runs).toFixed(1)}`)
    .join(", ");
  console.log(`  均值: ${averageText}`);
}

Object.keys(STRATEGIES).forEach((strategyKey, index) => {
  printStrategy(strategyKey, 10000 + index * 100000);
});
