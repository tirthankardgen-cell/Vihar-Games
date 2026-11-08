import { computerMove } from "./computer.ts";
import type { Cell, Difficulty, Mark } from "./engine.ts";

type Request = { board: Cell[]; mark: Mark; difficulty: Difficulty; revision: number; sessionId: string };
const context = self as unknown as {
  onmessage: (event: MessageEvent<Request>) => void;
  postMessage: (message: { cell: number | null; revision: number; sessionId: string }) => void;
};

context.onmessage = ({ data }) => {
  context.postMessage({ cell: computerMove(data.board, data.mark, data.difficulty), revision: data.revision, sessionId: data.sessionId });
};
