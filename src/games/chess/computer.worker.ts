/// <reference lib="webworker" />
import { chooseMove, type Difficulty } from "./computer.ts";
import type { Match } from "./engine.ts";

self.onmessage = (event: MessageEvent<{ id: string; match: Match; difficulty: Difficulty }>) => {
  const { id, match, difficulty } = event.data;
  try { self.postMessage({ id, revision: match.revision, fen: match.fen, decision: chooseMove(match, difficulty) }); }
  catch { self.postMessage({ id, revision: match.revision, fen: match.fen, error: "The computer could not finish thinking. Please try again." }); }
};
