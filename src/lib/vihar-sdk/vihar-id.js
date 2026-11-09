/** Vihar ID browser SDK v1. See https://vihar.online/help/browser-sdk */
const random = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), (n) => n.toString(16).padStart(2, "0")).join("");
const hash = async (value) => btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export function createViharId({ gameId, baseUrl = "https://vihar.online", onError = (error) => console.warn(`Vihar ID: ${error.code || "connection_error"}`) }) {
  const base = new URL(baseUrl).origin;
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(gameId)) throw new Error("A valid gameId is required.");
  if (!base.startsWith("https:") && !["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("Vihar ID requires HTTPS.");
  const storageKey = `vihar:id:v1:${base}:${gameId}`;
  let credential = null, sessionId = null, sequence = 0, timer = null, playing = false, lastTick = 0, pendingMs = 0, queue = Promise.resolve(), loginPending = false, starting = null;
  let removeLifecycle = () => {};
  let resetEmbeddedLaunch = false, resumingLaunch = null;
  const signOutViews = new Set();
  try { credential = JSON.parse(sessionStorage.getItem(storageKey) || "null"); } catch { /* Storage is optional. */ }
  if (credential?.expiresAt <= Date.now()) credential = null;
  function remember(value) { credential = value; try { if (value) sessionStorage.setItem(storageKey, JSON.stringify(value)); else sessionStorage.removeItem(storageKey); } catch { /* Continue in memory. */ } }
  async function request(action, data = {}, accessToken = credential?.accessToken, keepalive = false) {
    const response = await fetch(`${base}/api/vihar-id/${action}`, { method: "POST", mode: "cors", credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer", keepalive, headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) }, body: JSON.stringify({ ...data, gameId }) });
    const result = await response.json();
    if (!response.ok) throw Object.assign(new Error(result.message || "Vihar ID could not connect."), { code: result.error, status: response.status });
    return result;
  }
  async function exchange(code, verifier) {
    const result = await request("token", { code, ...(verifier ? { verifier } : {}) }, null);
    remember({ ...result, expiresAt: Date.now() + result.expiresIn * 1000 });
    return result;
  }
  function accumulate() {
    const now = performance.now();
    if (lastTick && playing && document.visibilityState === "visible") pendingMs += Math.max(0, now - lastTick);
    lastTick = now;
  }
  function report(operation = "pulse", keepalive = false) {
    accumulate();
    if (!sessionId || !credential) return Promise.resolve();
    const data = { sessionId, operation, sequence: ++sequence, elapsedMs: Math.min(45000, Math.floor(pendingMs)) };
    pendingMs = 0;
    const accessToken = credential.accessToken;
    // Serialized reports cannot overtake an earlier heartbeat. Failed intervals
    // are not replayed later as if the player had stayed online.
    queue = queue.catch(() => {}).then(() => request("session", data, accessToken, keepalive)).catch((error) => {
      if ([401, 403].includes(error.status) || error.code === "session_replaced") { clearInterval(timer); timer = null; sessionId = null; remember(null); }
      onError(error);
    });
    return queue;
  }
  async function stopSession() {
    if (starting) await starting.catch(() => {});
    clearInterval(timer); timer = null; removeLifecycle();
    await report("end", true); sessionId = null; playing = false;
  }
  async function signIn() {
    if (loginPending) throw Object.assign(new Error("Sign-in is already open."), { code: "login_pending" });
    // Open synchronously inside the user's click so browsers permit the popup.
    const popup = window.open("about:blank", "_blank", "popup,width=540,height=760");
    if (!popup) throw Object.assign(new Error("Allow popups for this game, then try again."), { code: "popup_blocked" });
    loginPending = true;
    try {
      const verifier = random(), state = random(), challenge = await hash(verifier);
      const code = await new Promise((resolve, reject) => {
        let timeout, poll;
        const finish = (error, code) => { clearTimeout(timeout); clearInterval(poll); window.removeEventListener("message", receive); popup.close(); if (error) reject(error); else resolve(code); };
        const receive = (event) => {
          if (event.origin !== base || event.source !== popup || event.data?.type !== "vihar:id:authorization" || event.data.state !== state) return;
          if (event.data.error) finish(Object.assign(new Error("Vihar ID sign-in was cancelled."), { code: event.data.error }));
          else if (typeof event.data.code === "string") finish(null, event.data.code);
        };
        window.addEventListener("message", receive);
        timeout = setTimeout(() => finish(Object.assign(new Error("Sign-in timed out. Try again."), { code: "login_timeout" })), 300000);
        poll = setInterval(() => { if (popup.closed) finish(Object.assign(new Error("Sign-in was closed."), { code: "popup_closed" })); }, 500);
        const params = new URLSearchParams({ gameId, origin: location.origin, challenge, state });
        popup.location.replace(`${base}/auth/connect?${params}`);
      });
      const resume = playing;
      if (sessionId) await stopSession();
      const oldToken = credential?.accessToken;
      await exchange(code, verifier);
      if (oldToken) void request("revoke", {}, oldToken).catch(onError);
      const player = await request("me");
      if (resume) await startSession();
      return player;
    } finally { loginPending = false; popup.close(); }
  }
  async function resumeLaunch() {
    if (resumingLaunch) return resumingLaunch;
    resumingLaunch = readLaunch();
    try { return await resumingLaunch; } finally { resumingLaunch = null; }
  }
  async function readLaunch() {
    // Each embedded launch belongs to the player who just pressed Play on
    // Vihar. Never inherit another account's tab credential on a shared device,
    // including when a new ticket fails or the parent explicitly starts guest.
    if (!resetEmbeddedLaunch && new URLSearchParams(location.search).get("vihar_embed") === "1") {
      resetEmbeddedLaunch = true;
      if (sessionId) await stopSession();
      remember(null);
    }
    const match = location.hash.match(/(?:^#|&)vihar_launch=([A-Za-z0-9_-]{43})$/);
    if (match) {
      const code = match[1];
      const clean = location.hash.slice(0, match.index);
      history.replaceState(history.state, "", `${location.pathname}${location.search}${clean === "#" ? "" : clean}`);
      await exchange(code);
    }
    return !!credential;
  }
  async function startSession() {
    if (starting) return starting;
    if (sessionId) { setPlaying(true); return { sessionId }; }
    if (!credential) return { guest: true };
    starting = beginSession();
    try { return await starting; } finally { starting = null; }
  }
  async function beginSession() {
    const id = random();
    const result = await request("session", { operation: "start", sessionId: id });
    sessionId = id; sequence = 0; pendingMs = 0; lastTick = performance.now(); playing = true;
    let wasVisible = document.visibilityState === "visible";
    const visibility = () => {
      const now = performance.now();
      if (wasVisible && playing) pendingMs += Math.max(0, now - lastTick);
      lastTick = now; wasVisible = document.visibilityState === "visible";
      void report();
    };
    const pagehide = () => { void report("end", true); clearInterval(timer); timer = null; sessionId = null; };
    const pageshow = async (event) => {
      if (!event.persisted || sessionId) return;
      const resume = playing;
      removeLifecycle();
      await queue;
      if (resume && credential) await startSession().catch(onError);
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", pagehide);
    window.addEventListener("pageshow", pageshow);
    removeLifecycle = () => { document.removeEventListener("visibilitychange", visibility); window.removeEventListener("pagehide", pagehide); window.removeEventListener("pageshow", pageshow); };
    timer = setInterval(() => { void report(); }, 15000);
    return result;
  }
  function setPlaying(value) { accumulate(); playing = !!value; void report(); }
  async function signOut() {
    const token = credential?.accessToken;
    try { await stopSession(); if (token) await request("revoke", {}, token); }
    finally { remember(null); for (const reset of signOutViews) reset(); }
  }
  function mount(element, { theme = "dark", compact = false } = {}) {
    const root = typeof element === "string" ? document.querySelector(element) : element;
    if (!root) throw new Error("Vihar ID button container was not found.");
    const button = document.createElement("button"), icon = document.createElement("img"), label = document.createElement("span"), note = document.createElement("p"), link = document.createElement("a"), status = document.createElement("p");
    const light = theme === "light";
    button.type = "button";
    icon.src = `${base}/brand/vihar-emblem${light ? "" : "-inverse"}.svg`;
    icon.alt = ""; icon.width = 24; icon.height = 24; icon.setAttribute("aria-hidden", "true");
    icon.style.cssText = "display:block;flex:0 0 24px;width:24px;height:24px;object-fit:contain";
    label.textContent = "Sign in with Vihar ID"; button.append(icon, label);
    button.style.cssText = `display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:46px;font:600 14px system-ui;line-height:1.4;padding:11px 18px;border:1px solid ${light ? "#d8d3cc" : "#27241f"};border-radius:9px;background:${light ? "#fffefa" : "#27241f"};color:${light ? "#27241f" : "#fffefa"};cursor:pointer`;
    note.textContent = "One player ID across community games. Keep your play activity and supported cloud saves together.";
    link.href = `${base}/help/vihar-id`; link.textContent = "About Vihar ID"; link.target = "_blank"; link.rel = "noopener noreferrer";
    status.setAttribute("role", "status");
    const reset = () => { status.textContent = "Signed out of this game."; };
    signOutViews.add(reset);
    button.onclick = async () => { button.disabled = true; try { const player = await signIn(); status.textContent = `Signed in as @${player.username}`; root.dispatchEvent(new CustomEvent("vihar:signin", { detail: player, bubbles: true })); } catch (error) { status.textContent = error.message; onError(error); } finally { button.disabled = false; } };
    root.replaceChildren(...(compact ? [button, status] : [button, note, link, status]));
    return () => { signOutViews.delete(reset); root.replaceChildren(); };
  }
  return { signIn, signOut, resumeLaunch, startSession, stopSession, setPlaying, mount,
    getPlayer: () => request("me"),
    loadProgress: () => request("save", { operation: "read" }),
    saveProgress: (data, revision) => request("save", { operation: "write", data, revision }),
    /** Send only to your OWN backend over HTTPS; validate with /me and gameId. */
    getAccessToken: () => credential?.mode === "identity" ? credential.accessToken : null,
    dispose: stopSession,
  };
}
