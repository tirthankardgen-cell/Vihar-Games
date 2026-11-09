export function createViharId(options: { gameId: string; baseUrl?: string; onError?: (error: { code?: string }) => void }): {
  resumeLaunch(): Promise<boolean>;
  startSession(): Promise<unknown>;
  stopSession(): Promise<void>;
  setPlaying(value: boolean): void;
};
