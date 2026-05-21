import { ENDINGS } from "../data/endings.js";
import { STAT_LABELS } from "../data/stats.js";

export function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function applyDelta(source, delta, max = 100) {
  const next = { ...source };
  Object.entries(delta).forEach(([key, value]) => {
    next[key] = clamp((next[key] ?? 0) + value, 0, max);
  });
  return next;
}

export function formatDelta(delta) {
  return Object.entries(delta)
    .map(([key, value]) => `${STAT_LABELS[key] ?? key}${value > 0 ? "+" : ""}${value}`)
    .join("，");
}

export function getEnding(stats, progress) {
  return ENDINGS.find((ending) => ending.test(stats, progress));
}

export function getRequirementValue(game, requirement) {
  const source = requirement.type === "stat" ? game.stats : game.progress;
  return source[requirement.key] ?? 0;
}

export function meetsGraduateRequirement(game, requirement) {
  return getRequirementValue(game, requirement) >= requirement.min;
}

export function getGraduateRouteChance(game, route) {
  if (route.ending) return 1;
  if (!route.requirements?.length) {
    const examReadiness = game.stats.knowledge * 0.28 + game.stats.focus * 0.22 + game.stats.perseverance * 0.28 - game.stats.pressure * 0.12;
    return clamp(0.58 + examReadiness / 250, 0.45, 0.9);
  }

  const requirementScore =
    route.requirements.reduce((sum, requirement) => {
      const value = getRequirementValue(game, requirement);
      return sum + clamp(value / requirement.min, 0, 1.25);
    }, 0) / route.requirements.length;
  const personalFit =
    game.stats.perseverance * 0.18 +
    game.stats.focus * 0.16 +
    game.stats.eq * 0.08 -
    game.stats.pressure * 0.12;

  return clamp(0.18 + requirementScore * 0.52 + personalFit / 300, 0.12, 0.92);
}

export function resolveGraduateRoute(game, route, random = Math.random) {
  const chance = getGraduateRouteChance(game, route);
  const success = !!route.ending || random() <= chance;
  return {
    chance,
    success,
    text: success ? route.successText : route.failText,
    effects: success ? route.successEffects : route.failEffects,
    progress: success ? route.successProgress : route.failProgress,
    nextStageId: success ? route.successStage : route.failStage,
    ending: route.ending,
    flags: success ? route.flags : route.failFlags,
  };
}

export function stageBonus(stageId, stats, progress) {
  if (stageId === "high_school") {
    const score = progress.exam * 0.55 + stats.knowledge * 0.25 + stats.focus * 0.15 - stats.pressure * 0.08;
    if (score >= 78) return { text: "你考入顶尖高校，获得更好的平台资源。", effects: { reputation: 8, knowledge: 5, network: 4 } };
    if (score >= 62) return { text: "你进入一所不错的大学，科研道路正式打开。", effects: { reputation: 4, knowledge: 3 } };
    return { text: "高考结果普通，但你保留了韧性和继续向上的空间。", effects: { perseverance: 5, pressure: -4 } };
  }

  if (stageId === "undergraduate") {
    const readiness = progress.gpa * 0.35 + progress.research * 0.45 + stats.reputation * 0.2;
    if (readiness >= 70) return { text: "你获得优秀导师认可，带着明确方向进入硕士阶段。", effects: { reputation: 6, literature: 4, network: 4 } };
    if (readiness >= 48) return { text: "你拿到升学机会，但仍需要补足科研基本功。", effects: { literature: 3, experiment: 2 } };
    return { text: "你勉强进入科研训练，压力和不确定性都更高了。", effects: { pressure: 6, perseverance: 3 } };
  }

  if (stageId === "master") {
    const readiness = progress.project * 0.4 + progress.paper * 0.4 + stats.literature * 0.1 + stats.writing * 0.1;
    if (readiness >= 72) return { text: "你带着论文和问题意识进入博士阶段。", effects: { reputation: 7, contribution: 6, innovation: 4 } };
    if (readiness >= 50) return { text: "你获得读博机会，但博士阶段需要更强的独立性。", effects: { perseverance: 5, literature: 3, pressure: 3 } };
    return { text: "你完成了硕士训练，但科研基础并不稳固。", effects: { pressure: 5, writing: 2 } };
  }

  if (stageId === "phd") {
    const readiness = progress.dissertation * 0.45 + progress.originality * 0.4 + stats.contribution * 0.15;
    if (readiness >= 75) return { text: "你的博士工作形成了清晰原创贡献，拿到青年教师位置。", effects: { reputation: 9, contribution: 8, network: 5 } };
    if (readiness >= 52) return { text: "你顺利博士毕业，开始独立承担课题。", effects: { reputation: 5, writing: 4, pressure: 2 } };
    return { text: "博士毕业过程艰难，你进入下一阶段时仍背着很重的压力。", effects: { pressure: 8, perseverance: 4 } };
  }

  if (stageId === "young_faculty") {
    const readiness = progress.fund * 0.45 + progress.team * 0.35 + stats.reputation * 0.2;
    if (readiness >= 70) return { text: "你站稳了独立 PI 的位置，团队开始产出稳定成果。", effects: { reputation: 8, contribution: 6, money: 8 } };
    if (readiness >= 48) return { text: "你保住了方向，也理解了管理和科研的双重压力。", effects: { eq: 4, network: 4, pressure: 3 } };
    return { text: "青年教师阶段消耗很大，你的团队基础仍然薄弱。", effects: { pressure: 7, health: -4 } };
  }

  if (stageId === "professor") {
    const readiness = progress.majorProject * 0.45 + progress.talent * 0.35 + stats.contribution * 0.2;
    if (readiness >= 72) return { text: "你形成了学术影响和人才梯队，进入院士候选视野。", effects: { reputation: 10, contribution: 8, network: 6 } };
    if (readiness >= 50) return { text: "你成为稳健的学术带头人，但距离最高评审仍有差距。", effects: { reputation: 6, contribution: 4 } };
    return { text: "你承担了大量事务，真正能沉淀为学术影响的成果偏少。", effects: { pressure: 6, eq: 3 } };
  }

  return { text: "你进入最终评审阶段，所有积累都会被重新衡量。", effects: { reputation: 2 } };
}

export function paperReview(stats, progress, random = Math.random) {
  const quality =
    stats.writing * 0.24 +
    stats.literature * 0.18 +
    stats.experiment * 0.18 +
    stats.innovation * 0.22 +
    (progress.paper ?? 0) * 0.12 +
    (progress.dissertation ?? 0) * 0.06 -
    stats.pressure * 0.1 +
    random() * 18;

  if (quality >= 88) {
    return {
      result: "高水平接收",
      effects: { reputation: 10, contribution: 9, pressure: -5 },
      progress: { paper: 10, dissertation: 8, acceptedPapers: 1, highImpactPapers: 1, representativeWorks: 1 },
    };
  }
  if (quality >= 72) {
    return {
      result: "接收",
      effects: { reputation: 8, contribution: 7, pressure: -4 },
      progress: { paper: 8, dissertation: 6, acceptedPapers: 1 },
    };
  }
  if (quality >= 62) {
    return {
      result: "小修",
      effects: { reputation: 4, writing: 3, pressure: 2 },
      progress: { paper: 6, dissertation: 4 },
    };
  }
  if (quality >= 46) {
    return {
      result: "大修",
      effects: { writing: 4, experiment: 2, pressure: 5 },
      progress: { paper: 4, dissertation: 3 },
    };
  }
  return {
    result: "拒稿",
    effects: { writing: 2, perseverance: 2, pressure: 7 },
    progress: { paper: 2 },
  };
}
