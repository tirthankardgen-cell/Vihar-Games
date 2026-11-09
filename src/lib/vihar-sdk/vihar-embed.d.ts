export function createViharEmbed(options: {
  gameId: string;
  baseUrl?: string;
  onVisibilityChange?: (visible: boolean) => void;
  onExit?: () => void | Promise<void>;
}): { embedded: boolean; ready(): void; exit(): Promise<void>; dispose(): void };
