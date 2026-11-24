const AudioSys = (function () {
  let ctx = null;
  let buffer = null;
  let enabled = true;
  let lastPlay = 0;
  let loading = false;
  let loaded = false;
  let volume = (typeof CONFIG !== "undefined") ? CONFIG.audioVolume : 0.8;

  function ensureContext() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  async function load() {
    if (loaded || loading) return loaded;
    loading = true;
    try {
      const res = await fetch(CONFIG.audioFile, { cache: "force-cache" });
      if (!res.ok) throw new Error("audio not found: " + res.status);
      const arr = await res.arrayBuffer();
      const c = ensureContext();
      if (!c) throw new Error("no audio context");
      buffer = await c.decodeAudioData(arr.slice(0));
      loaded = true;
    } catch (e) {
      console.warn("Audio no disponible:", e.message);
      loaded = false;
    } finally {
      loading = false;
    }
    return loaded;
  }

  function playCoyeye(force) {
    if (!enabled) return false;
    const now = performance.now() / 1000;
    const minInterval = (typeof CONFIG !== "undefined") ? CONFIG.audioMinInterval : 1.6;
    if (!force && now - lastPlay < minInterval) return false;
    lastPlay = now;
    const c = ensureContext();
    if (!c) return false;
    if (!loaded) {
      load().then(() => { if (loaded) playBuffer(c); });
      return false;
    }
    return playBuffer(c);
  }

  function playBuffer(c) {
    if (!buffer) return false;
    try {
      if (c.state === "suspended") c.resume();
      const src = c.createBufferSource();
      src.buffer = buffer;
      const gain = c.createGain();
      gain.gain.value = volume;
      // small fade to avoid clicks
      gain.gain.setValueAtTime(0, c.currentTime);
      gain.gain.linearRampToValueAtTime(volume, c.currentTime + 0.02);
      src.connect(gain).connect(c.destination);
      src.start(0);
      return true;
    } catch (e) {
      console.warn("play error", e);
      return false;
    }
  }

  function setEnabled(v) { enabled = v; if (v) ensureContext(); }
  function isEnabled() { return enabled; }
  function toggle() { setEnabled(!enabled); if (enabled) ensureContext(); return enabled; }
  function setVolume(v) { volume = Math.max(0, Math.min(1, v)); }

  return { ensureContext, load, playCoyeye, setEnabled, isEnabled, toggle, setVolume };
})();
window.AudioSys = AudioSys;
