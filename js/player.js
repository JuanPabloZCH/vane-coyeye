class Player {
  constructor() {
    this.lane = 1; // 0,1,2
    this.laneX = [0,0,0];
    this.x = 0;
    this.y = 0;
    this.baseY = 0;
    this.vy = 0;
    this.jumping = false;
    this.sliding = false;
    this.state = "run"; // run, jump, slide, trip, defeated, celebrate
    this.animT = 0;
    this.tripTimer = 0;
    this.invincible = 0;
    this.scale = 1;
  }

  init(W, H) {
    const laneSpacing = Math.min(120, W / 4);
    const cx = W / 2;
    this.laneX = [cx - laneSpacing, cx, cx + laneSpacing];
    this.x = this.laneX[this.lane];
    this.baseY = H * 0.78;
    this.y = this.baseY;
  }

  setLane(n) {
    this.lane = Math.max(0, Math.min(CONFIG.laneCount - 1, n));
    this.x = this.laneX[this.lane];
  }

  moveLane(dir) {
    this.setLane(this.lane + dir);
  }

  jump() {
    if (this.state === "defeated" || this.state === "trip") return;
    if (!this.jumping) {
      this.jumping = true;
      this.vy = -520;
      this.state = "jump";
    }
  }

  slide() {
    if (this.state === "defeated" || this.state === "trip") return;
    if (!this.jumping) {
      this.sliding = true;
      this.state = "slide";
      setTimeout(() => { if (this.state === "slide") { this.sliding = false; this.state = "run"; } }, 420);
    }
  }

  trip() {
    if (this.state === "defeated") return;
    this.state = "trip";
    this.tripTimer = 0.9;
    AudioSys.playCoyeye();
  }

  update(dt) {
    this.animT += dt;
    if (this.invincible > 0) this.invincible -= dt;
    // jump physics
    if (this.jumping) {
      this.vy += 1600 * dt;
      this.y += this.vy * dt;
      if (this.y >= this.baseY) {
        this.y = this.baseY;
        this.vy = 0;
        this.jumping = false;
        if (this.state === "jump") this.state = "run";
      }
    } else {
      this.y = this.baseY;
    }
    if (this.state === "trip") {
      this.tripTimer -= dt;
      if (this.tripTimer <= 0) { this.state = "run"; this.sliding = false; }
    }
  }

  hitbox() {
    // returns {x,y,w,h} center-based
    const w = this.sliding ? 46 : 34;
    const h = this.sliding ? 26 : 58;
    return { x: this.x - w/2, y: this.y - h, w, h };
  }

  draw(ctx) {
    const x = this.x, y = this.y;
    ctx.save();
    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath(); ctx.ellipse(x, this.baseY + 4, 26, 7, 0, 0, Math.PI*2); ctx.fill();

    // trip shake
    let sx = 0, sy = 0;
    if (this.state === "trip") { sx = Math.sin(this.animT*40)*4; sy = Math.abs(Math.sin(this.animT*40))*3; }
    ctx.translate(sx, -sy);

    // body
    const run = this.state === "run" || this.state === "jump" || this.state === "slide";
    const legPhase = Math.sin(this.animT * 12) * (this.state === "run" ? 1 : 0.3);

    // legs
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    if (!this.sliding) {
      // left leg
      ctx.beginPath();
      ctx.moveTo(x - 6, y - 18);
      ctx.lineTo(x - 10 - legPhase*6, y + 2);
      ctx.stroke();
      // right leg
      ctx.beginPath();
      ctx.moveTo(x + 6, y - 18);
      ctx.lineTo(x + 10 + legPhase*6, y + 2);
      ctx.stroke();
      // shoes (white)
      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.ellipse(x - 10 - legPhase*6, y + 4, 9, 4, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + 10 + legPhase*6, y + 4, 9, 4, 0, 0, Math.PI*2); ctx.fill();
    } else {
      // sliding: legs tucked
      ctx.beginPath();
      ctx.moveTo(x - 6, y - 10);
      ctx.lineTo(x - 18, y + 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 6, y - 10);
      ctx.lineTo(x + 18, y + 2);
      ctx.stroke();
    }

    // torso (blue polo)
    ctx.fillStyle = "#1e6bff";
    if (this.sliding) {
      ctx.beginPath();
      ctx.ellipse(x, y - 16, 26, 12, 0, 0, Math.PI*2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x - 17, y - 46, 34, 30, 8) : ctx.rect(x-17, y-46, 34, 30);
      ctx.fill();
    }

    // arms
    ctx.strokeStyle = "#1e6bff";
    ctx.lineWidth = 5;
    const armPhase = Math.sin(this.animT * 12 + Math.PI) * (this.state === "run" ? 1 : 0.2);
    if (!this.sliding) {
      ctx.beginPath();
      ctx.moveTo(x - 17, y - 40);
      ctx.lineTo(x - 26 - armPhase*5, y - 22);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 17, y - 40);
      ctx.lineTo(x + 26 + armPhase*5, y - 22);
      ctx.stroke();
      // hands
      ctx.fillStyle = "#f5c9a8";
      ctx.beginPath(); ctx.arc(x - 26 - armPhase*5, y - 20, 4, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 26 + armPhase*5, y - 20, 4, 0, Math.PI*2); ctx.fill();
    }

    // head
    const headY = this.sliding ? y - 24 : y - 58;
    ctx.fillStyle = "#f5c9a8";
    ctx.beginPath(); ctx.arc(x, headY, 15, 0, Math.PI*2); ctx.fill();

    // hair (black)
    ctx.fillStyle = "#1a1a2e";
    ctx.beginPath();
    ctx.arc(x, headY - 3, 16, Math.PI, Math.PI*2);
    ctx.fill();
    // hair strands
    ctx.beginPath();
    ctx.moveTo(x - 14, headY - 2);
    ctx.quadraticCurveTo(x - 18, headY + 6, x - 12, headY + 10);
    ctx.lineTo(x - 8, headY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 14, headY - 2);
    ctx.quadraticCurveTo(x + 18, headY + 6, x + 12, headY + 10);
    ctx.lineTo(x + 8, headY + 4);
    ctx.closePath();
    ctx.fill();

    // eyes
    ctx.fillStyle = "#1a1a2e";
    if (this.state === "trip" || this.state === "defeated") {
      // scared/closed
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#1a1a2e";
      ctx.beginPath(); ctx.moveTo(x-7, headY-2); ctx.lineTo(x-3, headY+2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x-3, headY-2); ctx.lineTo(x-7, headY+2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+3, headY-2); ctx.lineTo(x+7, headY+2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+7, headY-2); ctx.lineTo(x+3, headY+2); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(x - 5, headY - 1, 3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 5, headY - 1, 3, 0, Math.PI*2); ctx.fill();
      // shine
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(x - 4, headY - 2, 1.2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 6, headY - 2, 1.2, 0, Math.PI*2); ctx.fill();
    }

    // mouth
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (this.state === "trip") {
      ctx.arc(x, headY + 5, 4, Math.PI, Math.PI*2);
    } else if (this.state === "defeated") {
      ctx.arc(x, headY + 6, 4, 0, Math.PI);
    } else {
      ctx.arc(x, headY + 4, 3, 0, Math.PI);
    }
    ctx.stroke();

    // celebration sparkle
    if (this.state === "celebrate") {
      ctx.fillStyle = "rgba(255,209,102,0.9)";
      for (let i = 0; i < 4; i++) {
        const a = this.animT*4 + i*Math.PI/2;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a)*28, headY + Math.sin(a)*28, 3, 0, Math.PI*2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
window.Player = Player;
