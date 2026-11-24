const AudioSys = (function () {
  let ctx = null;
  let buffer = null;
  let enabled = true;
  let lastPlay = 0;
  let loading = false;
  let loaded = false;

  function ensureContext() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  async function load() {
    if (loaded || loading) return;
    loading = true;
    try {
      const res = await fetch(CONFIG.audioFile);
      if (!res.ok) throw new Error("audio not found");
      const arr = await res.arrayBuffer();
      const c = ensureContext();
      if (!c) throw new Error("no context");
      buffer = await c.decodeAudioData(arr);
      loaded = true;
    } catch (e) {
      console.warn("Audio no disponible:", e.message);
      loaded = false;
    } finally {
      loading = false;
    }
  }

  function playCoyeye(force) {
    if (!enabled) return;
    const now = performance.now() / 1000;
    if (!force && now - lastPlay < CONFIG.audioMinInterval) return;
    lastPlay = now;
    if (!loaded) { load(); return; }
    const c = ensureContext();
    if (!c || !buffer) return;
    try {
      const src = c.createBufferSource();
      src.buffer = buffer;
      const gain = c.createGain();
      gain.gain.value = CONFIG.audioVolume;
      src.connect(gain).connect(c.destination);
      src.start(0);
    } catch (e) { console.warn(e); }
  }

  function setEnabled(v) { enabled = v; if (v) ensureContext(); }
  function isEnabled() { return enabled; }
  function toggle() { setEnabled(!enabled); return enabled; }

  return { ensureContext, load, playCoyeye, setEnabled, isEnabled, toggle };
})();
window.AudioSys = AudioSys;
