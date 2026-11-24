const Game = (function () {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  let W = 0, H = 0, dpr = 1;
  let running = false;
  let paused = false;
  let state = "menu";
  let lastTime = 0;
  let raf = null;

  let player;
  let obstacles = [];
  let collectibles = [];
  let particles = [];
  let floatTexts = [];
  let bgLayers = [];
  let score = 0;
  let distance = 0;
  let hearts = 0;       // collected blue hearts
  let lives = 0;        // current lives
  let best = 0;
  let speed = 0;
  let targetSpeed = 0;
  let spawnTimer = 0;
  let collectTimer = 0;
  let surpriseTimer = 0;
  let screenShake = 0;
  let specialTriggered = false;
  let specialShown = false;
  let coyeyeCooldown = 0;
  let spiderEventTimer = 0;
  let spiderEventActive = 0;
  let spiderSpawnClock = 0;
  let skyT = 0;
  let touchStart = null;
  let lastObstacleLane = -1;
  let elapsed = 0;       // survival time seconds
  let level = 1;
  let levelChangedAt = 0;
  let invulnFlash = 0;
  let milestones = { 30: false, 60: false, 120: false, 180: false };

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
      { speed: 0.12, items: [] },
      { speed: 0.3, items: [] },
      { speed: 0.55, items: [] },
    ];
    for (let li = 0; li < bgLayers.length; li++) {
      const layer = bgLayers[li];
      const count = 10;
      for (let i = 0; i < count; i++) {
        layer.items.push({
          x: (i / count) * W + Math.random() * 30,
          w: 50 + Math.random() * 70,
          h: 50 + Math.random() * (li * 50 + 40),
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
    lives = CONFIG.maxLives;
    speed = CONFIG.startSpeed;
    targetSpeed = CONFIG.startSpeed;
    spawnTimer = 1.6;
    collectTimer = 1.0;
    surpriseTimer = 12;
    screenShake = 0;
    specialTriggered = false;
    specialShown = false;
    coyeyeCooldown = 0;
    spiderEventTimer = 22;
    spiderEventActive = 0;
    spiderSpawnClock = 0;
    skyT = 0;
    lastObstacleLane = -1;
    elapsed = 0;
    level = 1;
    levelChangedAt = 0;
    milestones = { 30: false, 60: false, 120: false, 180: false };
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
    const touchEl = document.getElementById("touchControls");
    if (CONFIG.showTouchControls) touchEl.classList.remove("hidden");
    if (!isTouch()) touchEl.classList.add("hidden");
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
    UI.hideAllScreens();
    UI.setHudVisible(true);
    lastTime = performance.now();
  }
  function continuePlay() {
    state = "playing";
    running = true;
    paused = false;
    UI.hideAllScreens();
    UI.setHudVisible(true);
    document.body.classList.add("playing");
    lastTime = performance.now();
    loop();
  }

  function takeDamage(amount, reason) {
    if (player.invincible > 0) return;
    lives = Math.max(0, lives - amount);
    player.invincible = CONFIG.invulnerabilityTime;
    player.trip();
    spawnBurst(player.x, player.y - 20, 20, "#ff5555");
    screenShake = 0.45;
    UI.showToast("¡Ay! -" + amount + " ❤️");
    if (lives <= 0) {
      setTimeout(() => gameOver(), 300);
    }
  }

  function gameOver() {
    state = "gameover";
    running = false;
    if (score > best) { best = score; saveBest(); }
    UI.setHudVisible(false);
    UI.gameOver({ score, distance, hearts, best });
    UI.showScreen("go");
    document.body.classList.remove("playing");
    document.getElementById("touchControls").classList.add("hidden");
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
    document.getElementById("touchControls").classList.add("hidden");
    if (raf) cancelAnimationFrame(raf);
    spawnBurst(W/2, H*0.5, 40, "#1e6bff");
    if (player) player.state = "celebrate";
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
    elapsed += dt;

    // level progression by time
    const newLevel = Math.min(5, 1 + Math.floor(elapsed / 30));
    if (newLevel > level) {
      level = newLevel;
      levelChangedAt = elapsed;
      const msgs = ["", "¡Vane está calentando! 💙", "¡Nivel 2!", "¡Ahora sí, cuidado!", "¡Las arañas llegaron!", "¡COYEYE MODE!"];
      UI.showToast(msgs[level] || "¡Nivel " + level + "!");
      AudioSys.playCoyeye();
    }

    // target speed by level
    targetSpeed = Math.min(CONFIG.maxSpeed, CONFIG.startSpeed + (level - 1) * CONFIG.speedPerLevel);
    speed += (targetSpeed - speed) * Math.min(1, CONFIG.speedLerp * dt);

    distance += (speed / 12) * dt;
    score += speed * dt * 0.5;

    player.update(dt);

    // spawn obstacles with reaction safety
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      const last = obstacles.length ? obstacles[obstacles.length-1] : null;
      const safeGap = last ? last.y > 150 : true;
      if (safeGap) {
        let lane = Math.floor(Math.random() * CONFIG.laneCount);
        if (lane === lastObstacleLane && CONFIG.laneCount > 1) {
          lane = (lane + 1 + Math.floor(Math.random() * (CONFIG.laneCount - 1))) % CONFIG.laneCount;
        }
        lastObstacleLane = lane;

        // choose type based on level
        let type;
        const heavyChance = (level >= 3) ? 0.06 : 0;
        const spiderChance = (level >= 2 ? 0.16 : 0.05) + (level >= 4 ? 0.1 : 0);
        const r = Math.random();
        if (r < heavyChance) type = OBSTACLE_TYPES.find(t => t.id === "heavy");
        else if (r < heavyChance + spiderChance) type = OBSTACLE_TYPES[0];
        else type = OBSTACLE_TYPES[1 + Math.floor(Math.random() * (OBSTACLE_TYPES.length - 2))]; // exclude heavy index last
        // ensure not heavy when level low
        if (level < 3 && type && type.id === "heavy") type = OBSTACLE_TYPES[1];

        obstacles.push(new Obstacle(type, lane, -40));

        const baseInterval = CONFIG.spawnIntervalStart - (level - 1) * 0.18;
        const minI = Math.max(CONFIG.spawnIntervalMin, baseInterval - 0.4);
        spawnTimer = Math.max(minI, baseInterval) + Math.random() * 0.3;
      } else {
        spawnTimer = 0.12;
      }
    }

    // spider event (less early)
    if (level >= 2) {
      spiderEventTimer -= dt;
      if (spiderEventTimer <= 0 && !spiderEventActive) {
        spiderEventActive = 1.4;
        spiderSpawnClock = 0;
        spiderEventTimer = (level >= 4 ? 14 : 20) + Math.random() * 8;
        UI.showToast("🕷️ ¡Arañas! ¡COYEYE!");
      }
    }
    if (spiderEventActive > 0) {
      spiderEventActive -= dt;
      spiderSpawnClock -= dt;
      if (spiderSpawnClock <= 0) {
        const lane = Math.floor(Math.random() * CONFIG.laneCount);
        obstacles.push(new Obstacle(OBSTACLE_TYPES[0], lane, -40));
        player.scare();
        spiderSpawnClock = 0.5;
      }
    }

    // collectibles
    collectTimer -= dt;
    if (collectTimer <= 0) {
      if (Math.random() < CONFIG.collectibleChance) collectibles.push(spawnCollectible());
      collectTimer = 1.2 + Math.random() * 1.2;
    }

    // update entities
    for (let o of obstacles) o.update(dt, speed, player.x);
    obstacles = obstacles.filter(o => o.y < H + 60);

    for (let c of collectibles) c.update(dt, speed);
    collectibles = collectibles.filter(c => c.y < H + 40 && !c.collected);

    // particles
    for (let p of particles) { p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 420*dt; p.life -= dt; }
    particles = particles.filter(p => p.life > 0);
    for (let f of floatTexts) { f.y -= 45*dt; f.life -= dt; }
    floatTexts = floatTexts.filter(f => f.life > 0);

    // collisions
    if (player.invincible <= 0 && player.state !== "trip") {
      const ph = player.hitbox();
      for (let o of obstacles) {
        if (o.passed) continue;
        if (o.lane !== player.lane) continue;
        const oh = o.hitbox(player.laneX);
        if (rectOverlap(ph, oh)) {
          const type = o.type;
          // low obstacle cleared by jump
          if (type.low && player.jumping) continue;
          // high obstacle cleared by slide or jump
          if (type.high && (player.sliding || player.jumping)) continue;
          // spider: damage + trip + scare
          if (type.id === "spider") {
            takeDamage(type.damage, "spider");
            o.passed = true;
            break;
          } else {
            // normal/heavy obstacle
            takeDamage(type.damage, type.id);
            o.passed = true;
            break;
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
        // heal life if heart collectible
        if (c.type.heal) {
          if (lives < CONFIG.maxLives) {
            lives = Math.min(CONFIG.maxLives, lives + 1);
            UI.showToast("❤️ +1 vida");
            spawnBurst(c.x, c.y, 16, "#ff5577");
          } else {
            score += 30;
            floatTexts.push({ x: c.x, y: c.y - 10, text: "+30", color: "#ffd166", life: 1.0 });
          }
        }
        if (c.type.id === "num08") {
          UI.showToast("08 💙");
          spawnBurst(c.x, c.y, 28, "#ffffff");
        }
        if (c.type.id === "heart" && Math.random() < 0.2) {
          UI.showToast(CONFIG.surpriseMessages[Math.floor(Math.random()*CONFIG.surpriseMessages.length)]);
        }
      }
    }

    // random coyeye trip (costs no life? just funny) - make it not damage, just trip
    coyeyeCooldown -= dt;
    if (coyeyeCooldown <= 0 && Math.random() < 0.0015) {
      player.trip();
      screenShake = 0.25;
      coyeyeCooldown = 10;
      UI.showToast("¡COYEYE! 😂");
    }

    // surprise message
    surpriseTimer -= dt;
    if (surpriseTimer <= 0) {
      UI.showToast(CONFIG.surpriseMessages[Math.floor(Math.random()*CONFIG.surpriseMessages.length)]);
      surpriseTimer = 14 + Math.random() * 10;
    }

    // milestones rewards
    if (!milestones[30] && elapsed >= 30) { milestones[30]=true; UI.showToast("¡30 segundos! 💙"); }
    if (!milestones[60] && elapsed >= 60) { milestones[60]=true; UI.showToast("¡1 minuto! 🎉"); AudioSys.playCoyeye(); }
    if (!milestones[120] && elapsed >= 120) { milestones[120]=true; UI.showToast("¡2 minutos! ¡Increíble! 🏆"); }
    if (!milestones[180] && elapsed >= 180) { milestones[180]=true; UI.showToast("¡3 minutos! ¡Leyenda! 👑"); }

    // special trigger
    if (!specialTriggered && (distance >= CONFIG.specialDistance || hearts >= CONFIG.specialHearts)) {
      specialTriggered = true;
      triggerSpecial();
      return;
    }

    if (screenShake > 0) screenShake = Math.max(0, screenShake - dt * 2.5);
    skyT += dt;
  }

  function rectOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function spawnBurst(x, y, n, color) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 50 + Math.random() * 160;
      particles.push({ x, y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp - 60, life: 0.5 + Math.random()*0.4, color, size: 2 + Math.random()*3 });
    }
  }

  function draw() {
    ctx.save();
    if (screenShake > 0) {
      const sx = (Math.random()-0.5)*screenShake*16;
      const sy = (Math.random()-0.5)*screenShake*16;
      ctx.translate(sx, sy);
    }
    drawBackground();
    for (let c of collectibles) c.draw(ctx, player.laneX);
    for (let o of obstacles) o.draw(ctx, player.laneX);
    if (player) {
      // blinking when invincible
      if (player.invincible > 0 && Math.floor(player.invincible * 10) % 2 === 0) {
        ctx.globalAlpha = 0.35;
      }
      player.draw(ctx);
      ctx.globalAlpha = 1;
    }
    for (let p of particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (let f of floatTexts) {
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.fillStyle = f.color;
      ctx.font = "bold 16px Nunito, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    if (state === "playing") UI.updateHUD({ score, distance, hearts, best, lives });
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    const night = (Math.sin(skyT * 0.08) + 1) / 2;
    if (night > 0.6) {
      g.addColorStop(0, "#0b1a3a");
      g.addColorStop(0.6, "#1a2f5a");
      g.addColorStop(1, "#264a8a");
    } else {
      g.addColorStop(0, "#6aa9ff");
      g.addColorStop(0.6, "#b8d8ff");
      g.addColorStop(1, "#e8f2ff");
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    for (let li = 0; li < bgLayers.length; li++) {
      const layer = bgLayers[li];
      const off = (distance * 2 * layer.speed) % W;
      for (let it of layer.items) {
        let x = it.x - off;
        if (x < -it.w) x += W + it.w;
        for (let k = 0; k < 2; k++) {
          const xx = x + k * W;
          if (xx > W + it.w) break;
          if (xx < -it.w) continue;
          ctx.fillStyle = it.color;
          const bh = it.h * (0.35 + li*0.12);
          ctx.fillRect(xx, H * 0.58 - bh, it.w, bh + H * 0.42);
        }
      }
    }

    ctx.fillStyle = (night > 0.6) ? "#152a52" : "#1f3a6e";
    ctx.fillRect(0, H * 0.86, W, H * 0.14);
    ctx.fillStyle = "#1e6bff";
    ctx.fillRect(0, H * 0.86, W, 4);

    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 2;
    for (let i = 0; i < CONFIG.laneCount - 1; i++) {
      const x = (player.laneX[i] + player.laneX[i+1]) / 2;
      ctx.beginPath();
      ctx.moveTo(x, H * 0.72);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    ctx.font = "14px serif";
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    for (let i = 0; i < 5; i++) {
      const x = (i * 157 + distance * 0.4) % W;
      const y = 50 + Math.sin(skyT + i) * 18;
      ctx.fillText("💙", x, y);
    }
  }

  function handleKey(e) {
    if (state !== "playing") return;
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { player.moveLane(-1); e.preventDefault(); }
    else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { player.moveLane(1); e.preventDefault(); }
    else if (e.key === "ArrowUp" || e.key === " " || e.key === "w" || e.key === "W") { player.jump(); e.preventDefault(); }
    else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") { player.slide(); e.preventDefault(); }
    else if (e.key === "p" || e.key === "P" || e.key === "Escape") { pause(); }
  }

  function handleTouchStart(e) {
    if (state !== "playing") return;
    const t = e.changedTouches[0];
    touchStart = { x: t.clientX, y: t.clientY, time: performance.now() };
    e.preventDefault();
  }
  function handleTouchEnd(e) {
    if (!touchStart || state !== "playing") return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    const adx = Math.abs(dx), ady = Math.abs(dy);
    if (adx < 18 && ady < 18) { touchStart = null; return; }
    if (adx > ady) {
      if (dx > 0) player.moveLane(1); else player.moveLane(-1);
    } else {
      if (dy < 0) player.jump(); else player.slide();
    }
    touchStart = null;
    e.preventDefault();
  }
  function handleTouchMove(e) { if (state === "playing") e.preventDefault(); }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === "playing") pause();
  });

  function drawMenuChar() {
    const c = document.getElementById("menuChar");
    if (!c) return;
    const cx = c.getContext("2d");
    const p = new Player();
    p.init(200, 220);
    p.laneX = [100];
    p.lane = 0;
    p.x = 100;
    p.baseY = 195;
    p.y = 195;
    let t = 0;
    function loop() {
      t += 0.016;
      cx.clearRect(0, 0, 200, 220);
      p.animT = t;
      p.state = "run";
      p.draw(cx);
      requestAnimationFrame(loop);
    }
    loop();
  }

  return {
    init() {
      resize();
      window.addEventListener("resize", resize);
      window.addEventListener("orientationchange", () => setTimeout(resize, 100));
      loadBest();
      UI.init();
      drawMenuChar();
      window.addEventListener("keydown", handleKey);
      canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
      canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
      canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
      document.querySelectorAll(".tc-btn").forEach(b => {
        const act = () => {
          if (!player || state !== "playing") return;
          const d = b.dataset.dir;
          if (d === "left") player.moveLane(-1);
          if (d === "right") player.moveLane(1);
          if (d === "up") player.jump();
          if (d === "down") player.slide();
        };
        b.addEventListener("touchstart", (e) => { e.preventDefault(); act(); }, { passive: false });
        b.addEventListener("click", act);
      });
    },
    start, pause, resume, continuePlay, reset,
    getState() { return state; },
    getScore() { return score; },
  };
})();
window.Game = Game;
