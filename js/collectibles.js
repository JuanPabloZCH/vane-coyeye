const COLLECTIBLE_TYPES = [
  { id: "heart", emoji: "💙", color: "#1e6bff", value: 1, points: 50 },
  { id: "infinity", emoji: "♾️", color: "#7fb0ff", value: 0, points: 80 },
  { id: "finger", emoji: "🫰🏽", color: "#ffd166", value: 0, points: 60 },
  { id: "star", emoji: "⭐", color: "#ffd166", value: 0, points: 40 },
  { id: "letter", emoji: "💌", color: "#ff7fb0", value: 0, points: 70 },
  { id: "num08", emoji: "08", color: "#ffffff", value: 0, points: 200, special: true },
];

class Collectible {
  constructor(type, lane, y) {
    this.type = type;
    this.lane = lane;
    this.y = y;
    this.x = 0;
    this.w = 30;
    this.h = 30;
    this.collected = false;
    this.pulse = Math.random() * Math.PI * 2;
  }
  update(dt, speed) {
    this.y += speed * dt;
    this.pulse += dt * 4;
  }
  hitbox(laneX) {
    this.x = laneX[this.lane];
    const s = 26;
    return { x: this.x - s/2, y: this.y - s/2, w: s, h: s };
  }
  draw(ctx, laneX) {
    const x = laneX[this.lane];
    const s = 26 + Math.sin(this.pulse) * 4;
    ctx.save();
    // glow
    ctx.shadowColor = this.type.color;
    ctx.shadowBlur = 14;
    ctx.fillStyle = this.type.color;
    ctx.beginPath();
    ctx.arc(x, this.y, s/2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = Math.round(s * 0.75) + "px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.fillText(this.type.emoji, x, this.y);
    ctx.restore();
  }
}

function spawnCollectible() {
  const r = Math.random();
  let type;
  if (r < 0.02) type = COLLECTIBLE_TYPES.find(t => t.id === "num08");
  else type = COLLECTIBLE_TYPES[Math.floor(Math.random() * (COLLECTIBLE_TYPES.length - 1))];
  const lane = Math.floor(Math.random() * CONFIG.laneCount);
  return new Collectible(type, lane, -30);
}

window.COLLECTIBLE_TYPES = COLLECTIBLE_TYPES;
window.Collectible = Collectible;
window.spawnCollectible = spawnCollectible;
