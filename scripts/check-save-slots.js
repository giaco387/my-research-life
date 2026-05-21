import assert from "node:assert/strict";
import {
  clearSaveSlot,
  createEmptySaveSlots,
  createInitialGame,
  normalizeSaveSlots,
  saveGameToSlot,
  SAVE_SLOT_COUNT,
} from "../src/game/state.js";

const emptySlots = createEmptySaveSlots();
assert.equal(emptySlots.length, SAVE_SLOT_COUNT);
assert.ok(emptySlots.every((slot, index) => slot.id === index + 1 && slot.game === null));

const game = createInitialGame({ screen: "play", turn: 3, ap: 2 });
const savedSlots = saveGameToSlot(emptySlots, 2, game);
assert.equal(savedSlots[1].game.turn, 3);
assert.equal(savedSlots[1].game.screen, "play");
assert.ok(savedSlots[1].updatedAt);
assert.equal(savedSlots[0].game, null);

const normalized = normalizeSaveSlots([
  { id: 2, name: "自定义存档", updatedAt: "2026-05-21T00:00:00.000Z", game },
  { id: 99, game },
  null,
]);
assert.equal(normalized.length, SAVE_SLOT_COUNT);
assert.equal(normalized[1].name, "自定义存档");
assert.equal(normalized[1].game.turn, 3);
assert.equal(normalized[2].game, null);

const cleared = clearSaveSlot(savedSlots, 2);
assert.equal(cleared[1].game, null);
assert.equal(cleared[1].updatedAt, null);

const repaired = normalizeSaveSlots([{ id: 1, game: { stageIndex: 999, turn: -3, ap: -10 } }]);
assert.equal(repaired[0].game.stageIndex, 0);
assert.equal(repaired[0].game.turn, 1);
assert.equal(repaired[0].game.ap, 0);

console.log("多存档状态检查通过。");
