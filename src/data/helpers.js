export function action(id, name, cost, desc, effects, progress = {}, options = {}) {
  return { id, name, cost, desc, effects, progress, ...options };
}

export function event(id, title, desc, choices) {
  return { id, title, desc, choices };
}

export function choice(label, effects, progress = {}) {
  return { label, effects, progress };
}
