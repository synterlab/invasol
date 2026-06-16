export class Shot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isCharged: boolean;
  isSplit: boolean;
  radius: number;
  angle: number;
  private trailTimer: number = 0;

  constructor(
    x: number,
    y: number,
    angle: number,
    isCharged: boolean,
    isSplit = false
  ) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.isCharged = isCharged;
    this.isSplit = isSplit;
    const speed = isCharged ? 300 : 520;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = isCharged ? 11 : 6;
  }

  update(dt: number, canvasWidth: number) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.trailTimer += dt;

    if (this.x < this.radius || this.x > canvasWidth - this.radius) {
      this.vx *= -1;
      this.x = Math.max(this.radius, Math.min(this.x, canvasWidth - this.radius));
    }
  }

  shouldSpawnTrail(dt: number): boolean {
    const interval = this.isCharged ? 0.02 : 0.025;
    if (this.trailTimer >= interval) {
      this.trailTimer = 0;
      return true;
    }
    return false;
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    if (this.isCharged) {
      ctx.shadowColor = "#59D98E";
      ctx.shadowBlur = 20;
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
      grad.addColorStop(0, "#E0FFF0");
      grad.addColorStop(0.5, "#59D98E");
      grad.addColorStop(1, "#1E8E63");
      ctx.fillStyle = grad;
    } else {
      ctx.shadowColor = "rgba(232,217,166,0.8)";
      ctx.shadowBlur = 8;
      const grad = ctx.createRadialGradient(this.x - 1, this.y - 1, 0, this.x, this.y, this.radius);
      grad.addColorStop(0, "#FFF8E0");
      grad.addColorStop(0.6, "#E8D9A6");
      grad.addColorStop(1, "#C4A840");
      ctx.fillStyle = grad;
    }
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
