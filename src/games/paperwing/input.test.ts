import test from "node:test";
import assert from "node:assert/strict";
import { createFlightInput, flightAction } from "./input.ts";

test("Space starts, flaps, resumes and retries according to the flight state", () => {
  for (const [view, action] of [["loading", null], ["choose", "start"], ["ready", "flap"], ["flying", "flap"], ["paused", "resume"], ["countdown", null], ["result", "retry"]] as const) {
    assert.equal(flightAction(view, "Space"), action);
  }
});
test("holding Space across collision or countdown never retries or flaps twice", () => {
  const keys = createFlightInput();
  assert.equal(keys.press("Space", false), true);
  assert.equal(keys.press("Space", true), false);
  assert.equal(flightAction("result", "Space"), "retry");
  assert.equal(keys.press("Space", false), false);
  keys.release("Space");
  assert.equal(keys.press("Space", false), true);
  assert.equal(keys.press("Space", true), false);
  keys.release("Space");
  assert.equal(keys.press("Space", false), true);
});
test("focus loss clears stale keys and other shortcuts retain their purpose", () => {
  const keys = createFlightInput(); keys.press("Space", false); keys.clear();
  assert.equal(keys.press("Space", false), true);
  assert.equal(flightAction("flying", "ArrowUp"), "flap");
  assert.equal(flightAction("flying", "KeyW"), "flap");
  assert.equal(flightAction("result", "KeyW"), null);
  assert.equal(flightAction("flying", "Escape"), "pause");
  assert.equal(flightAction("paused", "Escape"), "resume");
  assert.equal(flightAction("countdown", "Escape"), "pause");
});
