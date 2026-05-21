import { STAT_LABELS } from "../data/stats.js";

export function requirement(label, key, min, source = "stats") {
  return { label, key, min, source };
}

export function getRequirementValue(game, item) {
  return item.source === "progress" ? game.progress[item.key] ?? 0 : game.stats[item.key] ?? 0;
}

export function meetsRequirements(game, requirements = []) {
  return requirements.every((item) => getRequirementValue(game, item) >= item.min);
}

export function describeRequirements(requirements = []) {
  return requirements.map((item) => `${item.label ?? STAT_LABELS[item.key] ?? item.key} >= ${item.min}`);
}
