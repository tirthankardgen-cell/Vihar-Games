/**
 * Vihar Quick Play UI bridge, version 1. No authentication tokens cross this
 * channel. Use the existing vihar-id.js SDK as the sole gameplay reporter.
 * Call ready() only after your game menu and Exit to Vihar action are usable.
 */
export function createViharEmbed({ gameId, baseUrl = "https://vihar.online", onVisibilityChange = () => {}, onExit = () => {} }) {
  const origin = new URL(baseUrl).origin;
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(gameId)) throw new Error("A valid gameId is required.");
  if (!origin.startsWith("https:") && !["localhost", "127.0.0.1", "[::1]"].includes(new URL(origin).hostname)) throw new Error("The Vihar parent requires HTTPS.");
  const params = new URLSearchParams(location.search);
  const sessionId = params.get("vihar_session");
  const embedded = window.parent !== window && params.get("vihar_embed") === "1" && /^[A-Za-z0-9_-]{16,80}$/.test(sessionId || "");
  let initialized = false, ready = false, stopped = false, disposed = false, stopping;
  let failure = null;
  const send = (message) => {
    if (embedded && initialized && !disposed) window.parent.postMessage({ channel: "vihar:embed", version: 1, gameId, sessionId, ...message }, origin);
  };
  const stop = () => {
    if (!stopping) {
      stopped = true;
      onVisibilityChange(false);
      stopping = Promise.resolve().then(onExit);
    }
    return stopping;
  };
  const receive = (event) => {
    if (!embedded || disposed || event.source !== window.parent || event.origin !== origin) return;
    const data = event.data;
    if (!data || typeof data !== "object" || Array.isArray(data) || data.channel !== "vihar:embed" || data.version !== 1 || data.gameId !== gameId || data.sessionId !== sessionId) return;
    const keys = ["channel", "version", "gameId", "sessionId", "type"];
    if (data.type === "init" || data.type === "visibility") {
      if (typeof data.visible !== "boolean") return;
      keys.push("visible");
    } else if (data.type !== "stop") return;
    if (Object.keys(data).some((key) => !keys.includes(key))) return;
    if (data.type === "init") {
      initialized = true;
      if (stopped) return;
      onVisibilityChange(data.visible);
      if (failure) send({ type: "error", code: failure });
      else if (ready) send({ type: "ready" });
    } else if (initialized && data.type === "visibility" && !stopped) onVisibilityChange(data.visible);
    else if (initialized && data.type === "stop") void stop().then(() => send({ type: "stopped" }), () => send({ type: "stopped" }));
  };
  const exit = async () => {
    if (!embedded || !initialized || disposed) return;
    // The parent bounds the wait for stop/stopped, including stalled networks.
    send({ type: "exit" });
    await stop().catch(() => {});
  };
  const keydown = (event) => {
    if (event.key === "Escape" && embedded && initialized) {
      event.preventDefault();
      void exit();
    }
  };
  if (embedded) {
    window.addEventListener("message", receive);
    window.addEventListener("keydown", keydown);
  }
  return {
    embedded,
    ready() { if (!stopped) { ready = true; send({ type: "ready" }); } },
    fail(code = "load_failed") { failure = code === "unsupported" ? code : "load_failed"; send({ type: "error", code: failure }); },
    exit,
    dispose() { disposed = true; window.removeEventListener("message", receive); window.removeEventListener("keydown", keydown); },
  };
}
