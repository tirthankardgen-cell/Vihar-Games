import test from "node:test";
import assert from "node:assert/strict";
import { AUDIO_KEY, defaultAudioSettings, loadAudioSettings, saveValue } from "./persistence.ts";
test("sound and music default to on and saved choices round-trip independently of puzzle settings", () => {
  const data = new Map<string, string>();
  const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
  assert.deepEqual(loadAudioSettings(storage), defaultAudioSettings);
  assert.equal(saveValue(storage, AUDIO_KEY, { version: 1, sound: true, music: false, volume: .55 }), true);
  assert.deepEqual(loadAudioSettings(storage), { sound: true, music: false, volume: .55 });
  assert.equal(data.has("vihar-games:sudoku:settings:v1"), false);
});
test("corrupt, obsolete and blocked audio preferences recover quietly", () => {
  for (const value of ["bad", "null", '{"version":2,"sound":true,"music":true,"volume":1}', '{"version":1,"sound":true,"music":true,"volume":2}', '{"version":1,"sound":"yes","music":true,"volume":0.5}']) assert.deepEqual(loadAudioSettings({ getItem: () => value }), defaultAudioSettings);
  assert.deepEqual(loadAudioSettings({ getItem() { throw Error("blocked"); } }), defaultAudioSettings);
});
