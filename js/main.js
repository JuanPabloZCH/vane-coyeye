document.addEventListener("DOMContentLoaded", () => {
  Game.init();
  UI.init();

  const playBtn = document.getElementById("playBtn");
  const retryBtn = document.getElementById("retryBtn");
  const homeBtn = document.getElementById("homeBtn");
  const resumeBtn = document.getElementById("resumeBtn");
  const quitBtn = document.getElementById("quitBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const fullscreenBtn = document.getElementById("fullscreenBtn");
  const soundBtn = document.getElementById("soundBtn");
  const menuSoundBtn = document.getElementById("menuSoundBtn");
  const specialCloseBtn = document.getElementById("specialCloseBtn");

  playBtn.addEventListener("click", () => {
    AudioSys.ensureContext();
    AudioSys.load();
    Game.start();
  });
  retryBtn.addEventListener("click", () => {
    AudioSys.ensureContext();
    Game.start();
  });
  homeBtn.addEventListener("click", () => {
    location.reload();
  });
  resumeBtn.addEventListener("click", () => Game.resume());
  quitBtn.addEventListener("click", () => { location.reload(); });
  pauseBtn.addEventListener("click", () => Game.pause());
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener("click", () => {
      const el = document.documentElement;
      if (!document.fullscreenElement) {
        (el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen).call(el).catch(()=>{});
      } else {
        (document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen).call(document).catch(()=>{});
      }
    });
  }
  specialCloseBtn.addEventListener("click", () => {
    Game.continuePlay();
  });

  function toggleSound() {
    const on = AudioSys.toggle();
    UI.updateSoundButtons();
    if (on) AudioSys.playCoyeye(true);
  }
  soundBtn.addEventListener("click", toggleSound);
  menuSoundBtn.addEventListener("click", toggleSound);

  // keyboard pause
  window.addEventListener("keydown", (e) => {
    if (e.key === "p" || e.key === "P") {
      if (Game.getState() === "playing") Game.pause();
      else if (Game.getState() === "paused") Game.resume();
    }
  });
});
