import assert from "node:assert/strict";
import { ACTIONS } from "../src/data/actions.js";
import { EVENTS } from "../src/data/events.js";
import { GRADUATE_ROUTES } from "../src/data/graduateRoutes.js";
import { STAGES } from "../src/data/stages.js";
import { INITIAL_PROGRESS, INITIAL_STATS } from "../src/data/stats.js";

const statKeys = new Set(Object.keys(INITIAL_STATS));
const progressKeys = new Set(Object.keys(INITIAL_PROGRESS));
const stageIds = new Set(STAGES.map((stage) => stage.id));

function assertDeltaKeys(delta, context) {
  for (const key of Object.keys(delta ?? {})) {
    assert.ok(statKeys.has(key) || progressKeys.has(key), `${context} uses unknown key: ${key}`);
  }
}

function assertRequirements(requirements = [], context) {
  for (const requirement of requirements) {
    const validKeys = requirement.source === "progress" ? progressKeys : statKeys;
    assert.ok(validKeys.has(requirement.key), `${context} requirement uses unknown key: ${requirement.key}`);
  }
}

for (const stage of STAGES) {
  assert.ok(ACTIONS[stage.id], `${stage.id} is missing actions`);
  assert.ok(EVENTS[stage.id], `${stage.id} is missing events`);
  assert.ok(stage.turns > 0, `${stage.id} must have positive turns`);
  assert.ok(stage.ap > 0, `${stage.id} must have positive AP`);

  for (const key of Object.keys(stage.progress)) {
    assert.ok(progressKeys.has(key), `${stage.id} progress uses unknown key: ${key}`);
  }
}

for (const [stageId, actions] of Object.entries(ACTIONS)) {
  assert.ok(stageIds.has(stageId), `actions contain unknown stage: ${stageId}`);
  const actionIds = new Set();
  for (const action of actions) {
    assert.ok(!actionIds.has(action.id), `${stageId} has duplicate action id: ${action.id}`);
    actionIds.add(action.id);
    assert.ok(action.cost > 0, `${stageId}.${action.id} must cost positive AP`);
    if (action.maxUses !== undefined) {
      assert.ok(Number.isInteger(action.maxUses) && action.maxUses > 0, `${stageId}.${action.id} has invalid maxUses`);
    }
    assertDeltaKeys(action.effects, `${stageId}.${action.id}.effects`);
    assertDeltaKeys(action.progress, `${stageId}.${action.id}.progress`);
    assertRequirements(action.requirements, `${stageId}.${action.id}`);
    assertDeltaKeys(action.risk?.effects, `${stageId}.${action.id}.risk.effects`);
    assertDeltaKeys(action.risk?.progress, `${stageId}.${action.id}.risk.progress`);
  }
}

for (const [stageId, events] of Object.entries(EVENTS)) {
  assert.ok(stageIds.has(stageId), `events contain unknown stage: ${stageId}`);
  const eventIds = new Set();
  for (const event of events) {
    assert.ok(!eventIds.has(event.id), `${stageId} has duplicate event id: ${event.id}`);
    eventIds.add(event.id);
    assert.ok(event.choices.length > 0, `${stageId}.${event.id} must have choices`);
    for (const choice of event.choices) {
      assertDeltaKeys(choice.effects, `${stageId}.${event.id}.${choice.label}.effects`);
      assertDeltaKeys(choice.progress, `${stageId}.${event.id}.${choice.label}.progress`);
    }
  }
}

for (const route of GRADUATE_ROUTES) {
  assert.equal(route.ending, undefined, `${route.id} must not end the game at undergraduate graduation`);
  assert.ok(route.successStage && stageIds.has(route.successStage), `${route.id} has invalid successStage`);
  assert.ok(route.failStage && stageIds.has(route.failStage), `${route.id} has invalid failStage`);
  assertDeltaKeys(route.successEffects, `${route.id}.successEffects`);
  assertDeltaKeys(route.failEffects, `${route.id}.failEffects`);
  assertDeltaKeys(route.successProgress, `${route.id}.successProgress`);
  assertDeltaKeys(route.failProgress, `${route.id}.failProgress`);
  for (const requirement of route.requirements ?? []) {
    const validKeys = requirement.type === "stat" ? statKeys : progressKeys;
    assert.ok(validKeys.has(requirement.key), `${route.id} requirement uses unknown key: ${requirement.key}`);
  }
}

console.log("数据完整性检查通过。");
