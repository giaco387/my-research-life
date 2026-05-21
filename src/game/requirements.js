import { STAT_LABELS } from "../data/stats.js";

export function requirement(label, key, min, source = "stats", max) {
  return { label, key, min, source, max };
}

export function getRequirementValue(game, item) {
  if (item.source === "age") return game.age ?? 17;
  return item.source === "progress" ? game.progress[item.key] ?? 0 : game.stats[item.key] ?? 0;
}

export function meetsRequirements(game, requirements = []) {
  return requirements.every((item) => {
    const value = getRequirementValue(game, item);
    if (item.max !== undefined && value > item.max) return false;
    return value >= item.min;
  });
}

export function describeRequirements(requirements = []) {
  return requirements.map((item) => {
    const label = item.label ?? STAT_LABELS[item.key] ?? item.key;
    if (item.max !== undefined && item.min <= 0) return `${label} <= ${item.max}`;
    if (item.max !== undefined) return `${label} ${item.min}-${item.max}`;
    return `${label} >= ${item.min}`;
  });
}
