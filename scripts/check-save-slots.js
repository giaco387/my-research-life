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

const game = createInitialGame({ screen: "play", turn: 3, ap: 2, profile: { name: "阿研", gender: "female" } });
const savedSlots = saveGameToSlot(emptySlots, 2, game);
assert.equal(savedSlots[1].game.turn, 3);
assert.equal(savedSlots[1].game.screen, "play");
assert.equal(savedSlots[1].game.profile.name, "阿研");
assert.equal(savedSlots[1].game.profile.gender, "female");
assert.equal(savedSlots[1].game.career.maritalStatus, "未婚");
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

const migratedProfessor = normalizeSaveSlots([{ id: 1, game: { stageIndex: 5, turn: 2, ap: 4 } }]);
assert.equal(migratedProfessor[0].game.stageIndex, 6);
assert.equal(migratedProfessor[0].game.age, 39);

const migratedAcademician = normalizeSaveSlots([{ id: 1, game: { stageIndex: 6, turn: 2, ap: 4 } }]);
assert.equal(migratedAcademician[0].game.stageIndex, 8);
assert.equal(migratedAcademician[0].game.age, 54);

const repairedProfile = normalizeSaveSlots([{ id: 1, game: { profile: { name: "很长很长很长很长的名字", gender: "bad" } } }]);
assert.ok(repairedProfile[0].game.profile.name.length > 0);
assert.ok(repairedProfile[0].game.profile.name.length <= 12);
assert.equal(repairedProfile[0].game.profile.gender, "undisclosed");

const repairedCareer = normalizeSaveSlots([{ id: 1, game: { career: { children: 99, mentor: "", grants: { applications: 3 } } } }]);
assert.equal(repairedCareer[0].game.career.children, 8);
assert.equal(repairedCareer[0].game.career.mentor, "暂无");
assert.equal(repairedCareer[0].game.career.grants.applications, 3);
assert.equal(repairedCareer[0].game.career.grants.funded, 0);

console.log("多存档状态检查通过。");
