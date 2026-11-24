class Player {
  constructor() {
    this.lane = 1;
    this.laneX = [0,0,0];
    this.x = 0;
    this.y = 0;
    this.baseY = 0;
    this.vy = 0;
    this.jumping = false;
    this.sliding = false;
    this.state = "run";
    this.animT = 0;
    this.tripTimer = 0;
    this.invincible = 0;
    this.scale = 1;
    this.scareT = 0;
  }

  init(W, H) {
    const laneSpacing = Math.min(110, W / 3.6);
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
  moveLane(dir) { this.setLane(this.lane + dir); }

  jump() {
    if (this.state === "defeated" || this.state === "trip") return;
    if (!this.jumping) {
      this.jumping = true;
      this.vy = -620;
      this.state = "jump";
    }
  }
  slide() {
    if (this.state === "defeated" || this.state === "trip") return;
    if (!this.jumping) {
      this.sliding = true;
      this.state = "slide";
      clearTimeout(this._slideTimer);
      this._slideTimer = setTimeout(() => { if (this.state === "slide") { this.sliding = false; this.state = "run"; } }, 460);
    }
  }
  trip() {
    if (this.state === "defeated") return;
    this.state = "trip";
    this.tripTimer = 1.0;
    this.scareT = 1.0;
    AudioSys.playCoyeye(true);
  }
  scare() {
    this.scareT = 1.2;
  }
  update(dt) {
    this.animT += dt;
    if (this.invincible > 0) this.invincible -= dt;
    if (this.scareT > 0) this.scareT -= dt;
    if (this.jumping) {
      this.vy += 1700 * dt;
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
    const w = this.sliding ? 44 : 34;
    const h = this.sliding ? 28 : 62;
    return { x: this.x - w/2, y: this.y - h, w, h };
  }

  draw(ctx) {
    const x = this.x, y = this.y;
    const t = this.animT;
    ctx.save();

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath(); ctx.ellipse(x, this.baseY + 5, 28, 8, 0, 0, Math.PI*2); ctx.fill();

    // trip shake
    let sx = 0, sy = 0;
    if (this.state === "trip") { sx = Math.sin(t*45)*5; sy = Math.abs(Math.sin(t*45))*4; }
    ctx.translate(sx, -sy);

    const scared = this.scareT > 0;
    const runPhase = (this.state === "run" || this.state === "jump") ? Math.sin(t * 14) : 0;
    const slide = this.sliding || this.state === "slide";

    // --- LEGS ---
    if (!slide) {
      const stride = runPhase * 7;
      // left leg
      ctx.strokeStyle = "#2a2a3e";
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x - 5, y - 24);
      ctx.lineTo(x - 9 - stride, y + 3);
      ctx.stroke();
      // right leg
      ctx.beginPath();
      ctx.moveTo(x + 5, y - 24);
      ctx.lineTo(x + 9 + stride, y + 3);
      ctx.stroke();
      // shorts
      ctx.fillStyle = "#1e3a6e";
      ctx.beginPath();
      ctx.ellipse(x, y - 24, 15, 8, 0, 0, Math.PI*2);
      ctx.fill();
      // shoes
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#cfd8e3";
      ctx.lineWidth = 1;
      // left shoe
      ctx.beginPath(); ctx.ellipse(x - 9 - stride, y + 5, 11, 5, -0.2, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // right shoe
      ctx.beginPath(); ctx.ellipse(x + 9 + stride, y + 5, 11, 5, 0.2, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // shoe swoosh
      ctx.strokeStyle = "#1e6bff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 14 - stride, y + 5); ctx.lineTo(x - 4 - stride, y + 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 4 + stride, y + 2); ctx.lineTo(x + 14 + stride, y + 5); ctx.stroke();
    } else {
      // sliding: legs tucked to side
      ctx.strokeStyle = "#2a2a3e";
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(x - 4, y - 12); ctx.lineTo(x - 20, y + 3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 4, y - 12); ctx.lineTo(x + 20, y + 3); ctx.stroke();
      ctx.fillStyle = "#1e3a6e";
      ctx.beginPath(); ctx.ellipse(x, y - 12, 18, 9, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.ellipse(x - 20, y + 4, 9, 4, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + 20, y + 4, 9, 4, 0, 0, Math.PI*2); ctx.fill();
    }

    // --- TORSO (blue polo) ---
    if (!slide) {
      // body
      const grad = ctx.createLinearGradient(x - 18, y - 52, x + 18, y - 24);
      grad.addColorStop(0, "#3a8bff");
      grad.addColorStop(1, "#1e6bff");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(x - 18, y - 26);
      ctx.quadraticCurveTo(x - 20, y - 46, x - 12, y - 54);
      ctx.lineTo(x + 12, y - 54);
      ctx.quadraticCurveTo(x + 20, y - 46, x + 18, y - 26);
      ctx.closePath();
      ctx.fill();
      // collar
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(x - 8, y - 54);
      ctx.lineTo(x, y - 46);
      ctx.lineTo(x + 8, y - 54);
      ctx.closePath();
      ctx.fill();
      // collar line
      ctx.strokeStyle = "#dfe7ff";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x - 8, y - 54); ctx.lineTo(x, y - 46); ctx.lineTo(x + 8, y - 54); ctx.stroke();
      // polo button
      ctx.fillStyle = "#1e6bff";
      ctx.beginPath(); ctx.arc(x, y - 49, 1.6, 0, Math.PI*2); ctx.fill();
    } else {
      ctx.fillStyle = "#1e6bff";
      ctx.beginPath();
      ctx.ellipse(x, y - 18, 24, 12, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(x, y - 22, 6, 3, 0, 0, Math.PI*2);
      ctx.fill();
    }

    // --- ARMS ---
    if (!slide) {
      const armSwing = (this.state === "run") ? Math.sin(t * 14 + Math.PI) * 8 : 0;
      const scaredArms = scared || this.state === "trip";
      // left arm
      ctx.strokeStyle = "#3a8bff";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x - 16, y - 48);
      if (scaredArms) {
        ctx.lineTo(x - 26, y - 62);
      } else {
        ctx.lineTo(x - 24 - armSwing, y - 28 + armSwing*0.5);
      }
      ctx.stroke();
      // right arm
      ctx.beginPath();
      ctx.moveTo(x + 16, y - 48);
      if (scaredArms) {
        ctx.lineTo(x + 26, y - 62);
      } else {
        ctx.lineTo(x + 24 + armSwing, y - 28 - armSwing*0.5);
      }
      ctx.stroke();
      // hands
      ctx.fillStyle = "#f5c9a8";
      if (scaredArms) {
        ctx.beginPath(); ctx.arc(x - 26, y - 62, 5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 26, y - 62, 5, 0, Math.PI*2); ctx.fill();
      } else {
        ctx.beginPath(); ctx.arc(x - 24 - armSwing, y - 28 + armSwing*0.5, 5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 24 + armSwing, y - 28 - armSwing*0.5, 5, 0, Math.PI*2); ctx.fill();
      }
    }

    // --- HEAD ---
    const headY = slide ? y - 26 : y - 64;
    // hair back
    ctx.fillStyle = "#1a1a2e";
    ctx.beginPath();
    ctx.ellipse(x, headY + 2, 19, 22, 0, 0, Math.PI*2);
    ctx.fill();
    // hair strands (long) with movement
    const hairWave = Math.sin(t * 6) * 3;
    ctx.beginPath();
    ctx.moveTo(x - 16, headY + 4);
    ctx.quadraticCurveTo(x - 22 + hairWave, headY + 20, x - 14 + hairWave, headY + 34);
    ctx.lineTo(x - 8 + hairWave, headY + 28);
    ctx.quadraticCurveTo(x - 12, headY + 14, x - 10, headY + 6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 16, headY + 4);
    ctx.quadraticCurveTo(x + 22 - hairWave, headY + 20, x + 14 - hairWave, headY + 34);
    ctx.lineTo(x + 8 - hairWave, headY + 28);
    ctx.quadraticCurveTo(x + 12, headY + 14, x + 10, headY + 6);
    ctx.closePath();
    ctx.fill();

    // face (skin)
    ctx.fillStyle = "#f5c9a8";
    ctx.beginPath();
    ctx.ellipse(x, headY, 15, 17, 0, 0, Math.PI*2);
    ctx.fill();

    // bangs
    ctx.fillStyle = "#1a1a2e";
    ctx.beginPath();
    ctx.moveTo(x - 16, headY - 8);
    ctx.quadraticCurveTo(x - 12, headY - 18, x - 4, headY - 16);
    ctx.quadraticCurveTo(x, headY - 20, x + 4, headY - 16);
    ctx.quadraticCurveTo(x + 12, headY - 18, x + 16, headY - 8);
    ctx.lineTo(x + 16, headY - 2);
    ctx.quadraticCurveTo(x, headY - 6, x - 16, headY - 2);
    ctx.closePath();
    ctx.fill();

    // hair bow (feminine accessory)
    ctx.fillStyle = "#ff7fb0";
    ctx.beginPath();
    ctx.ellipse(x + 13, headY - 13, 6, 4, 0.4, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 13, headY - 13, 6, 4, -0.4, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = "#ff4d8d";
    ctx.beginPath();
    ctx.arc(x + 13, headY - 13, 2.5, 0, Math.PI*2);
    ctx.fill();

    // eyes
    const eyeY = headY - 1;
    if (this.state === "trip" || scared) {
      // scared wide eyes
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.ellipse(x - 6, eyeY, 5, 6, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + 6, eyeY, 5, 6, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#1a1a2e";
      ctx.beginPath(); ctx.arc(x - 6, eyeY + 1, 2.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 6, eyeY + 1, 2.5, 0, Math.PI*2); ctx.fill();
      // highlight
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(x - 5, eyeY - 1, 1, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 7, eyeY - 1, 1, 0, Math.PI*2); ctx.fill();
    } else if (this.state === "defeated") {
      ctx.strokeStyle = "#1a1a2e";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x-9, eyeY-2); ctx.lineTo(x-3, eyeY+2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x-3, eyeY-2); ctx.lineTo(x-9, eyeY+2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+3, eyeY-2); ctx.lineTo(x+9, eyeY+2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+9, eyeY-2); ctx.lineTo(x+3, eyeY+2); ctx.stroke();
    } else {
      ctx.fillStyle = "#1a1a2e";
      ctx.beginPath(); ctx.ellipse(x - 6, eyeY, 3.5, 4.5, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + 6, eyeY, 3.5, 4.5, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(x - 5, eyeY - 1.5, 1.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 7, eyeY - 1.5, 1.5, 0, Math.PI*2); ctx.fill();
    }

    // blush
    ctx.fillStyle = "rgba(255,120,150,0.35)";
    ctx.beginPath(); ctx.ellipse(x - 10, headY + 4, 4, 2.5, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 10, headY + 4, 4, 2.5, 0, 0, Math.PI*2); ctx.fill();

    // mouth
    ctx.strokeStyle = "#c0392b";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    if (this.state === "trip" || scared) {
      ctx.arc(x, headY + 7, 4, Math.PI, Math.PI*2);
    } else if (this.state === "defeated") {
      ctx.arc(x, headY + 8, 4, 0, Math.PI);
    } else if (this.state === "celebrate") {
      ctx.arc(x, headY + 5, 6, 0, Math.PI);
    } else {
      ctx.arc(x, headY + 5, 4, 0, Math.PI);
    }
    ctx.stroke();

    // celebrate sparkles
    if (this.state === "celebrate") {
      ctx.fillStyle = "rgba(255,209,102,0.9)";
      for (let i = 0; i < 5; i++) {
        const a = t*5 + i*Math.PI*2/5;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a)*30, headY + Math.sin(a)*30, 3, 0, Math.PI*2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
window.Player = Player;
