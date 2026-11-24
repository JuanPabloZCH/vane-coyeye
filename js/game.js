const Game = (function () {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  let W = 0, H = 0, dpr = 1;
  let running = false;
  let paused = false;
  let state = "menu"; // menu, playing, paused, gameover, special
  let lastTime = 0;
  let raf = null;

  // game data
  let player;
  let obstacles = [];
  let collectibles = [];
  let particles = [];
  let floatTexts = [];
  let bgLayers = [];
  let score = 0;
  let distance = 0;
  let hearts = 0;
  let best = 0;
  let speed = 0;
  let spawnTimer = 0;
  let collectTimer = 0;
  let surpriseTimer = 0;
  let screenShake = 0;
  let specialTriggered = false;
  let specialShown = false;
  let coyeyeCooldown = 0;
  let spiderEventTimer = 0;
  let skyT = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (player) player.init(W, H);
    initBg();
  }

  function initBg() {
    bgLayers = [
      { speed: 0.15, items: [] },
      { speed: 0.35, items: [] },
      { speed: 0.6, items: [] },
    ];
    // generate random buildings/trees per layer
    for (let li = 0; li < bgLayers.length; li++) {
      const layer = bgLayers[li];
      const count = 12;
      for (let i = 0; i < count; i++) {
        layer.items.push({
          x: (i / count) * W + Math.random() * 40,
          w: 40 + Math.random() * 60,
          h: 60 + Math.random() * (li * 40 + 40),
          type: li === 0 ? "far" : (li === 1 ? "mid" : "near"),
          color: li === 0 ? "#1a2f5a" : (li === 1 ? "#1f3a6e" : "#264a8a"),
        });
      }
    }
  }

  function loadBest() {
    try { best = parseFloat(localStorage.getItem("vane_coyeye_best") || "0"); } catch (e) { best = 0; }
  }
  function saveBest() {
    try { localStorage.setItem("vane_coyeye_best", String(best)); } catch (e) {}
  }

  function reset() {
    player = new Player();
    player.init(W, H);
    obstacles = [];
    collectibles = [];
    particles = [];
    floatTexts = [];
    score = 0;
    distance = 0;
    hearts = 0;
    speed = CONFIG.startSpeed;
    spawnTimer = 1.0;
    collectTimer = 0.6;
    surpriseTimer = 8;
    screenShake = 0;
    specialTriggered = false;
    specialShown = false;
    coyeyeCooldown = 0;
    spiderEventTimer = 0;
    skyT = 0;
    lastTime = performance.now();
  }

  function start() {
    AudioSys.ensureContext();
    AudioSys.load();
    reset();
    state = "playing";
    running = true;
    paused = false;
    UI.hideAllScreens();
    UI.setHudVisible(true);
    document.body.classList.add("playing");
    if (CONFIG.showTouchControls && isTouch()) UI.els.touch.classList.remove("hidden");
    loop();
  }

  function isTouch() {
    return ("ontouchstart" in window) || navigator.maxTouchPoints > 0;
  }

  function pause() {
    if (state !== "playing") return;
    state = "paused";
    paused = true;
    UI.showScreen("pause");
  }
  function resume() {
    if (state !== "paused") return;
    state = "playing";
    paused = false;
    UI.showScreen(null);
    lastTime = performance.now();
  }

  function gameOver() {
    state = "gameover";
    running = false;
    if (score > best) { best = score; saveBest(); }
    UI.setHudVisible(false);
    UI.gameOver({ score, distance, hearts, best });
    UI.showScreen("go");
    document.body.classList.remove("playing");
    UI.els.touch.classList.add("hidden");
    if (raf) cancelAnimationFrame(raf);
  }

  function triggerSpecial() {
    if (specialShown) return;
    specialShown = true;
    state = "special";
    running = false;
    if (score > best) { best = score; saveBest(); }
    UI.special();
    UI.showScreen("special");
    document.body.classList.remove("playing");
    UI.els.touch.classList.add("hidden");
    if (raf) cancelAnimationFrame(raf);
    spawnBurst(W/2, H*0.5, 40, "#1e6bff");
    if (player) player.state = "celebrate";
  }

  function continuePlay() {
    state = "playing";
    running = true;
    paused = false;
    UI.hideAllScreens();
    UI.setHudVisible(true);
    document.body.classList.add("playing");
    if (CONFIG.showTouchControls && isTouch()) UI.els.touch.classList.remove("hidden");
    lastTime = performance.now();
    loop();
  }

  function loop() {
    raf = requestAnimationFrame(loop);
    const now = performance.now();
    let dt = (now - lastTime) / 1000;
    lastTime = now;
    if (dt > 0.05) dt = 0.05;
    if (state !== "playing") { draw(); return; }
    update(dt);
    draw();
  }

  function update(dt) {
    // speed ramp
    speed = Math.min(CONFIG.maxSpeed, speed + CONFIG.speedRamp * dt);
    distance += (speed / 10) * dt; // meters-ish
    score += speed * dt * 0.5;

    player.update(dt);

    // spawn obstacles
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      obstacles.push(spawnObstacle(speed));
      spawnTimer = CONFIG.spawnIntervalStart - (speed - CONFIG.startSpeed) / (CONFIG.maxSpeed - CONFIG.startSpeed) * (CONFIG.spawnIntervalStart - CONFIG.spawnIntervalMin);
      if (spawnTimer < CONFIG.spawnIntervalMin) spawnTimer = CONFIG.spawnIntervalMin;
      spawnTimer += Math.random() * 0.3;
    }
    // spawn collectibles
    collectTimer -= dt;
    if (collectTimer <= 0) {
      if (Math.random() < CONFIG.collectibleChance) collectibles.push(spawnCollectible());
      collectTimer = 1.2 + Math.random() * 1.2;
    }

    // update obstacles
    for (let o of obstacles) o.update(dt, speed, player.x);
    obstacles = obstacles.filter(o => o.y < H + 60);

    // update collectibles
    for (let c of collectibles) c.update(dt, speed);
    collectibles = collectibles.filter(c => c.y < H + 40 && !c.collected);

    // update particles
    for (let p of particles) { p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 400*dt; p.life -= dt; }
    particles = particles.filter(p => p.life > 0);
    for (let f of floatTexts) { f.y -= 40*dt; f.life -= dt; }
    floatTexts = floatTexts.filter(f => f.life > 0);

    // collisions obstacles
    if (player.invincible <= 0 && player.state !== "trip") {
      const ph = player.hitbox();
      for (let o of obstacles) {
        if (o.passed) continue;
        const oh = o.hitbox(player.laneX);
        if (o.lane !== player.lane) continue;
        if (rectOverlap(ph, oh)) {
          // decide: low obstacle can jump over; high can slide under
          const type = o.type;
          if (type.low && player.jumping) continue; // cleared by jump
          if (type.high && player.sliding) continue; // cleared by slide
          // spider special
          if (type.id === "spider") {
            // trip + coyeye
            player.trip();
            spawnBurst(player.x, player.y - 20, 18, "#ff5555");
            screenShake = 0.4;
            // remove obstacle? let it pass
            o.passed = true;
            break;
          } else {
            // hit: game over
            spawnBurst(player.x, player.y - 20, 24, "#ff9900");
            screenShake = 0.6;
            AudioSys.playCoyeye(true);
            gameOver();
            return;
          }
        }
      }
    }

    // collectibles
    for (let c of collectibles) {
      if (c.collected) continue;
      if (c.lane !== player.lane) continue;
      const ch = c.hitbox(player.laneX);
      const ph = player.hitbox();
      if (rectOverlap(ph, ch)) {
        c.collected = true;
        if (c.type.id === "heart") hearts++;
        score += c.type.points;
        spawnBurst(c.x, c.y, 14, c.type.color);
        floatTexts.push({ x: c.x, y: c.y, text: "+" + c.type.points, color: c.type.color, life: 1.0 });
        if (c.type.id === "num08") {
          UI.showToast("08 💙");
          spawnBurst(c.x, c.y, 28, "#ffffff");
        }
        if (c.type.id === "heart") {
          // occasional romantic toast
          if (Math.random() < 0.25) UI.showToast(CONFIG.surpriseMessages[Math.floor(Math.random()*CONFIG.surpriseMessages.length)]);
        }
      }
    }

    // coyeye random trip event (rare)
    coyeyeCooldown -= dt;
    if (coyeyeCooldown <= 0 && Math.random() < 0.003) {
      player.trip();
      screenShake = 0.35;
      coyeyeCooldown = 6;
      UI.showToast("¡COYEYE! 😂");
    }

    // surprise message
    surpriseTimer -= dt;
    if (surpriseTimer <= 0) {
      UI.showToast(CONFIG.surpriseMessages[Math.floor(Math.random()*CONFIG.surpriseMessages.length)]);
      surpriseTimer = 12 + Math.random() * 10;
    }

    // special trigger
    if (!specialTriggered && (distance >= CONFIG.specialDistance || hearts >= CONFIG.specialHearts)) {
      specialTriggered = true;
      triggerSpecial();
      return;
    }

    // screen shake decay
    if (screenShake > 0) screenShake = Math.max(0, screenShake - dt * 2.5);

    // sky time
    skyT += dt;
  }

  function rectOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function spawnBurst(x, y, n, color) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 180;
      particles.push({ x, y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp - 80, life: 0.6 + Math.random()*0.4, color, size: 2 + Math.random()*4 });
    }
  }

  function draw() {
    ctx.save();
    if (screenShake > 0) {
      const sx = (Math.random()-0.5)*screenShake*20;
      const sy = (Math.random()-0.5)*screenShake*20;
      ctx.translate(sx, sy);
    }
    drawBackground();
    // collectibles
    for (let c of collectibles) c.draw(ctx, player.laneX);
    // obstacles
    for (let o of obstacles) o.draw(ctx, player.laneX);
    // player
    if (player) player.draw(ctx);
    // particles
    for (let p of particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // float texts
    for (let f of floatTexts) {
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.fillStyle = f.color;
      ctx.font = "bold 18px Nunito, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // HUD update
    if (state === "playing") UI.updateHUD({ score, distance, hearts, best });
  }

  function drawBackground() {
    // sky gradient
    const g = ctx.createLinearGradient(0, 0, 0, H);
    const night = (Math.sin(skyT * 0.1) + 1) / 2;
    g.addColorStop(0, night > 0.6 ? "#0b1a3a" : "#6aa9ff");
    g.addColorStop(0.6, night > 0.6 ? "#1a2f5a" : "#b8d8ff");
    g.addColorStop(1, night > 0.6 ? "#264a8a" : "#e8f2ff");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // parallax buildings
    for (let li = 0; li < bgLayers.length; li++) {
      const layer = bgLayers[li];
      const off = (distance * 2 * layer.speed) % W;
      for (let it of layer.items) {
        let x = it.x - off;
        if (x < -it.w) x += W + it.w;
        // draw two copies for seamless
        for (let k = 0; k < 2; k++) {
          const xx = x + k * (W + 0);
          if (xx > W + it.w) break;
          ctx.fillStyle = it.color;
          ctx.fillRect(xx, H * 0.55 - it.h * (0.4 + li*0.15), it.w, it.h * (0.4 + li*0.15) + H * 0.45);
        }
      }
    }

    // ground
    ctx.fillStyle = "#1f3a6e";
    ctx.fillRect(0, H * 0.86, W, H * 0.14);
    ctx.fillStyle = "#1e6bff";
    ctx.fillRect(0, H * 0.86, W, 4);
    // lane lines
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    for (let i = 0; i < CONFIG.laneCount - 1; i++) {
      const x = (player.laneX[i] + player.laneX[i+1]) / 2;
      ctx.beginPath();
      ctx.moveTo(x, H * 0.7);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    // hearts floating decoration
    ctx.font = "16px serif";
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    for (let i = 0; i < 6; i++) {
      const x = (i * 137 + distance * 0.5) % W;
      const y = 60 + Math.sin(skyT + i) * 20;
      ctx.fillText("💙", x, y);
    }
  }

  // input handlers attached in main.js via Game methods
  function handleKey(e) {
    if (state !== "playing") return;
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { player.moveLane(-1); e.preventDefault(); }
    else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { player.moveLane(1); e.preventDefault(); }
    else if (e.key === "ArrowUp" || e.key === " " || e.key === "w" || e.key === "W") { player.jump(); e.preventDefault(); }
    else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") { player.slide(); e.preventDefault(); }
    else if (e.key === "p" || e.key === "P" || e.key === "Escape") { pause(); }
  }
  function handleTouchStart(e) {
    const t = e.changedTouches[0];
    touchStart = { x: t.clientX, y: t.clientY, time: performance.now() };
  }
  function handleTouchEnd(e) {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    const adx = Math.abs(dx), ady = Math.abs(dy);
    if (adx < 20 && ady < 20) return;
    if (adx > ady) {
      if (dx > 0) player.moveLane(1); else player.moveLane(-1);
    } else {
      if (dy < 0) player.jump(); else player.slide();
    }
    touchStart = null;
  }
  let touchStart = null;

  // visibility pause
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === "playing") pause();
  });

  // menu char animation
  function drawMenuChar() {
    const c = document.getElementById("menuChar");
    if (!c) return;
    const cx = c.getContext("2d");
    const p = new Player();
    p.init(200, 220);
    p.laneX = [100];
    p.lane = 0;
    p.x = 100;
    p.baseY = 190;
    p.y = 190;
    let t = 0;
    function loop() {
      t += 0.016;
      cx.clearRect(0, 0, 200, 220);
      p.animT = t;
      p.draw(cx);
      requestAnimationFrame(loop);
    }
    loop();
  }

  return {
    init() {
      resize();
      window.addEventListener("resize", resize);
      loadBest();
      UI.init();
      drawMenuChar();
      // attach input
      window.addEventListener("keydown", handleKey);
      canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
      canvas.addEventListener("touchend", handleTouchEnd, { passive: true });
      // touch buttons
      document.querySelectorAll(".tc-btn").forEach(b => {
        b.addEventListener("touchstart", (e) => {
          e.preventDefault();
          const d = b.dataset.dir;
          if (d === "left") player && player.moveLane(-1);
          if (d === "right") player && player.moveLane(1);
          if (d === "up") player && player.jump();
          if (d === "down") player && player.slide();
        }, { passive: false });
        b.addEventListener("click", () => {
          if (!player) return;
          const d = b.dataset.dir;
          if (d === "left") player.moveLane(-1);
          if (d === "right") player.moveLane(1);
          if (d === "up") player.jump();
          if (d === "down") player.slide();
        });
      });
    },
    start,
    pause,
    resume,
    continuePlay,
    reset,
    getState() { return state; },
    getScore() { return score; },
  };
})();
window.Game = Game;
