// Obstacle & spider types
const OBSTACLE_TYPES = [
  { id: "spider", emoji: "🕷️", color: "#2b2b3a", w: 40, h: 34, low: false, high: false },
  { id: "briefcase", emoji: "💼", color: "#8b5a2b", w: 38, h: 30, low: true, high: false },
  { id: "coffee", emoji: "☕", color: "#6f4e37", w: 30, h: 34, low: true, high: false },
  { id: "phone", emoji: "📱", color: "#444", w: 26, h: 34, low: true, high: false },
  { id: "bed", emoji: "🛏️", color: "#b08968", w: 46, h: 30, low: false, high: true },
  { id: "web", emoji: "🕸️", color: "#aaa", w: 44, h: 40, low: false, high: true },
];

class Obstacle {
  constructor(type, lane, y) {
    this.type = type;
    this.lane = lane;
    this.y = y;
    this.x = 0; // set by laneX
    this.w = type.w;
    this.h = type.h;
    this.passed = false;
    this.chasing = type.id === "spider";
    this.vx = 0;
  }
  update(dt, speed, playerX) {
    this.y += speed * dt;
    if (this.chasing) {
      // spiders creep toward player lane slowly
      // horizontal drift handled in game via lane
    }
  }
  hitbox(laneX) {
    this.x = laneX[this.lane];
    return { x: this.x - this.w/2, y: this.y - this.h, w: this.w, h: this.h };
  }
  draw(ctx, laneX) {
    const x = laneX[this.lane];
    ctx.save();
    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath(); ctx.ellipse(x, this.y + 2, this.w/2, 6, 0,0,Math.PI*2); ctx.fill();
    // body circle
    ctx.fillStyle = this.type.color;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - this.w/2, this.y - this.h, this.w, this.h, 8) : ctx.rect(x-this.w/2, this.y-this.h, this.w, this.h);
    ctx.fill();
    // emoji
    ctx.font = Math.round(this.h * 0.7) + "px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.type.emoji, x, this.y - this.h/2);
    // spider legs animation if spider
    if (this.type.id === "spider") {
      ctx.strokeStyle = "#1a1a2e";
      ctx.lineWidth = 2;
      const t = performance.now()/200;
      for (let i = 0; i < 4; i++) {
        const a = (i/4)*Math.PI*2 + t;
        ctx.beginPath();
        ctx.moveTo(x - this.w/2 + 4, this.y - this.h/2);
        ctx.lineTo(x - this.w/2 - 6 + Math.cos(a)*4, this.y - this.h/2 + Math.sin(a)*8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + this.w/2 - 4, this.y - this.h/2);
        ctx.lineTo(x + this.w/2 + 6 + Math.cos(a+1)*4, this.y - this.h/2 + Math.sin(a+1)*8);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

function spawnObstacle(speed) {
  const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
  // spiders more frequent at higher speeds
  let t = type;
  if (Math.random() < 0.22) t = OBSTACLE_TYPES[0];
  const lane = Math.floor(Math.random() * CONFIG.laneCount);
  return new Obstacle(t, lane, -40);
}

window.OBSTACLE_TYPES = OBSTACLE_TYPES;
window.Obstacle = Obstacle;
window.spawnObstacle = spawnObstacle;
