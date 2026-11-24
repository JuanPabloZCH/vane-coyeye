const UI = {
  els: {},
  init() {
    this.els = {
      hud: document.getElementById("hud"),
      score: document.getElementById("score"),
      distance: document.getElementById("distance"),
      hearts: document.getElementById("hearts"),
      best: document.getElementById("best"),
      menu: document.getElementById("menuScreen"),
      pause: document.getElementById("pauseScreen"),
      go: document.getElementById("gameOverScreen"),
      special: document.getElementById("specialScreen"),
      goMsg: document.getElementById("goMessage"),
      goScore: document.getElementById("goScore"),
      goDistance: document.getElementById("goDistance"),
      goHearts: document.getElementById("goHearts"),
      goBest: document.getElementById("goBest"),
      toast: document.getElementById("toast"),
      specialMsg: document.getElementById("specialMessage"),
      touch: document.getElementById("touchControls"),
      soundBtn: document.getElementById("soundBtn"),
      menuSoundBtn: document.getElementById("menuSoundBtn"),
      canvas: document.getElementById("gameCanvas"),
    };
    this.updateSoundButtons();
  },
  showScreen(name) {
    ["menu","pause","go","special"].forEach(s => {
      const el = this.els[s === "go" ? "go" : s];
      if (el) el.classList.add("hidden");
    });
    if (name && this.els[name]) this.els[name].classList.remove("hidden");
  },
  hideAllScreens() {
    ["menu","pause","go","special"].forEach(s => {
      const key = s === "go" ? "go" : s;
      if (this.els[key]) this.els[key].classList.add("hidden");
    });
  },
  updateHUD(state) {
    this.els.score.textContent = Math.floor(state.score);
    this.els.distance.textContent = Math.floor(state.distance) + " m";
    this.els.hearts.textContent = state.hearts;
    this.els.best.textContent = Math.floor(state.best);
  },
  setHudVisible(v) { this.els.hud.classList.toggle("hidden", !v); },
  showToast(msg, dur = 2200) {
    const t = this.els.toast;
    t.textContent = msg;
    t.classList.remove("hidden");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.add("hidden"), dur);
  },
  updateSoundButtons() {
    const on = AudioSys.isEnabled();
    const label = on ? "🔊" : "🔇";
    if (this.els.soundBtn) this.els.soundBtn.textContent = label;
    if (this.els.menuSoundBtn) this.els.menuSoundBtn.textContent = (on ? "🔊" : "🔇") + " Sonido";
  },
  gameOver(data) {
    const msgs = CONFIG.gameOverMessages;
    this.els.goMsg.textContent = msgs[Math.floor(Math.random() * msgs.length)];
    this.els.goScore.textContent = Math.floor(data.score);
    this.els.goDistance.textContent = Math.floor(data.distance) + " m";
    this.els.goHearts.textContent = data.hearts;
    this.els.goBest.textContent = Math.floor(data.best);
  },
  special() {
    this.els.specialMsg.textContent = CONFIG.specialMessage;
  },
};
window.UI = UI;
