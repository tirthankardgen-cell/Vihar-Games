import { chooseShot, type Difficulty } from "./computer.ts";
import { resolveShot, type Match, type Shot } from "./engine.ts";
import { simulate, type Simulation } from "./physics.ts";

export type ShotRequest = { id: string; match: Match; practice: boolean; shot?: Shot; difficulty: Difficulty };
export type ShotReply = { id: string; revision: number; shot?: Shot; simulation?: Simulation; match?: Match; error?: string };

self.onmessage = (event: MessageEvent<ShotRequest>) => {
  const request = event.data;
  const reply: ShotReply = { id: request.id, revision: request.match.revision };
  try {
    const shot = request.shot ?? chooseShot(request.match, request.difficulty);
    const simulation = simulate(request.match, shot);
    Object.assign(reply, { shot, simulation, match: resolveShot(request.match, simulation.outcome, request.practice) });
  } catch (error) { reply.error = error instanceof Error ? error.message : "The shot could not be completed. Retake it."; }
  self.postMessage(reply);
};
