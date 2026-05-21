import { ACTIONS } from "../data/actions.js";
import { EVENTS } from "../data/events.js";
import { STAGES } from "../data/stages.js";
import { applyDelta, formatDelta, getEnding, paperReview, resolveGraduateRoute, stageBonus } from "./formulas.js";
import { meetsRequirements } from "./requirements.js";
import { appendLogs, getStage, getStageIndex, isFinalStage, shouldShowEnding } from "./state.js";

export function canPerformAction(game, action) {
  const uses = game.actionUses?.[action.id] ?? 0;
  return (
    !game.activeEvent &&
    !game.pendingGraduateChoice &&
    !shouldShowEnding(game) &&
    (!action.maxUses || uses < action.maxUses) &&
    action.cost <= game.ap &&
    meetsRequirements(game, action.requirements)
  );
}

export function canPerformAnyAction(game) {
  const stage = getStage(game);
  return (ACTIONS[stage.id] ?? []).some((action) => canPerformAction(game, action));
}

export function pickEvent(game, random = Math.random) {
  const stage = getStage(game);
  const usedEvents = game.usedEvents ?? [];
  const pool = (EVENTS[stage.id] ?? []).filter((event) => !usedEvents.includes(event.id));
  if (!pool.length) return null;

  const pressureBoost = game.stats.pressure > 70 ? 0.25 : 0;
  if (random() > 0.42 + pressureBoost) return null;
  return pool[Math.floor(random() * pool.length)];
}

export function advanceTurn(game, options = {}) {
  const { allowEvent = true, random = Math.random } = options;
  const stage = getStage(game);
  const event = allowEvent ? pickEvent(game, random) : null;
  const recovery = game.stats.health < 20 ? -2 : 0;
  const nextStats = applyDelta(game.stats, {
    health: game.stats.health < 30 ? 3 : 1,
    pressure: game.stats.pressure > 65 ? 1 : -1,
  });

  if (event) {
    return appendLogs(
      {
        ...game,
        stats: nextStats,
        activeEvent: event,
        pendingAdvance: true,
        usedEvents: [...(game.usedEvents ?? []), event.id],
      },
      [`触发事件：${event.title}`],
    );
  }

  if (game.turn >= stage.turns) {
    return settleStage({ ...game, stats: nextStats, pendingAdvance: false });
  }

  return appendLogs(
    {
      ...game,
      stats: nextStats,
      turn: game.turn + 1,
      ap: Math.max(3, stage.ap + recovery),
      pendingAdvance: false,
    },
    [`行动点不足，自动进入${stage.name}第${game.turn + 1}回合。`],
  );
}

export function settleStage(game) {
  if (isFinalStage(game)) {
    const ending = getEnding(game.stats, game.progress);
    return appendLogs(
      {
        ...game,
        ending,
        pendingAdvance: false,
        pendingGraduateChoice: false,
      },
      [`结局：${ending.title}`],
    );
  }

  const finished = getStage(game);
  const bonus = stageBonus(finished.id, game.stats, game.progress);
  const stats = applyDelta(game.stats, bonus.effects);

  if (finished.id === "undergraduate") {
    return appendLogs(
      {
        ...game,
        stats,
        ending: null,
        pendingAdvance: false,
        pendingGraduateChoice: true,
      },
      [`阶段结算：${bonus.text}`, "本科结束：请选择读研路径。"],
    );
  }

  const nextStage = STAGES[game.stageIndex + 1];
  return appendLogs(
    {
      ...game,
      stageIndex: game.stageIndex + 1,
      turn: 1,
      ap: nextStage.ap,
      stats,
      ending: null,
      pendingAdvance: false,
      pendingGraduateChoice: false,
    },
    [`阶段结算：${bonus.text}`, `进入${nextStage.name}阶段：${nextStage.goal}`],
  );
}

export function performAction(game, action, random = Math.random) {
  if (!canPerformAction(game, action)) return game;

  const stage = getStage(game);
  let stats = applyDelta(game.stats, action.effects);
  let progress = applyDelta(game.progress, action.progress);
  let papers = game.papers ?? [];
  const logs = [`${stage.name} 第${game.turn}回合：${action.name}。${formatDelta(action.effects)}`];

  if (action.system === "paper_submission") {
    const review = paperReview(stats, progress, random);
    stats = applyDelta(stats, review.effects);
    progress = applyDelta(progress, review.progress);
    papers = [{ turn: game.turn, stage: stage.id, result: review.result }, ...papers].slice(0, 12);
    logs.push(`投稿结果：${review.result}。${formatDelta(review.effects)}`);
  }

  if (action.risk && random() < action.risk.chance) {
    stats = applyDelta(stats, action.risk.effects ?? {});
    progress = applyDelta(progress, action.risk.progress ?? {});
    logs.push(action.risk.text);
  }

  const updated = appendLogs(
    {
      ...game,
      ap: game.ap - action.cost,
      stats,
      progress,
      papers,
      actionUses: { ...(game.actionUses ?? {}), [action.id]: (game.actionUses?.[action.id] ?? 0) + 1 },
      ending: shouldShowEnding(game) ? game.ending : null,
    },
    logs,
  );

  return canPerformAnyAction(updated) ? updated : advanceTurn(updated, { random });
}

export function chooseEvent(game, option) {
  const stats = applyDelta(game.stats, option.effects);
  const progress = applyDelta(game.progress, option.progress);
  const resolved = appendLogs(
    {
      ...game,
      stats,
      progress,
      activeEvent: null,
      pendingAdvance: false,
    },
    [`事件选择：${option.label}。${formatDelta(option.effects)}`],
  );

  return game.pendingAdvance ? advanceTurn(resolved, { allowEvent: false }) : resolved;
}

export function chooseGraduateRoute(game, route, random = Math.random) {
  if (!game.pendingGraduateChoice) return game;

  const result = resolveGraduateRoute(game, route, random);
  const stats = applyDelta(game.stats, result.effects);
  const progress = applyDelta(game.progress, result.progress);
  const routeLog = `读研去向：${route.name}。${result.text}`;

  if (result.ending) {
    return appendLogs(
      {
        ...game,
        stats,
        progress,
        ending: result.ending,
        pendingGraduateChoice: false,
        flags: { ...(game.flags ?? {}), ...(result.flags ?? {}) },
      },
      [routeLog, `结局：${result.ending.title}`],
    );
  }

  const nextStageIndex = getStageIndex(result.nextStageId);
  if (nextStageIndex < 0) {
    throw new Error(`Unknown graduate route stage: ${result.nextStageId}`);
  }

  const nextStage = STAGES[nextStageIndex];
  return appendLogs(
    {
      ...game,
      stageIndex: nextStageIndex,
      turn: 1,
      ap: nextStage.ap,
      stats,
      progress,
      ending: null,
      pendingGraduateChoice: false,
      pendingAdvance: false,
      flags: { ...(game.flags ?? {}), ...(result.flags ?? {}) },
    },
    [routeLog, `进入${nextStage.name}阶段：${nextStage.goal}`],
  );
}
