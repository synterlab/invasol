export type SlimeType = "Common" | "Crystal" | "Volatile" | "Mirror";

export class Slime {
  x: number;
  y: number;
  type: SlimeType;
  hp: number;
  radius: number;
  color: string;
  vy: number;
  vx: number = 0;
  isColossus: boolean;
  cracked: boolean = false;
  pulseT: number = 0;
  iridT: number = 0;
  zigzag: boolean = false;
  zigzagT: number = 0;
  zigzagAmp: number = 0;
  hitFlash: number = 0;

  constructor(
    x: number,
    y: number,
    type: SlimeType,
    speed: number = 60,
    isColossus = false,
    zigzag = false
  ) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.isColossus = isColossus;
    this.vy = speed;
    this.zigzag = zigzag;
    this.zigzagT = Math.random() * Math.PI * 2;
    this.zigzagAmp = 40 + Math.random() * 30;

    const scale = isColossus ? 1.8 : 1;

    switch (type) {
      case "Crystal":
        this.hp = isColossus ? 5 : 2;
        this.radius = 20 * scale;
        this.color = "#A8F0D0";
        break;
      case "Volatile":
        this.hp = isColossus ? 3 : 1;
        this.radius = 17 * scale;
        this.color = "#FF9A3C";
        break;
      case "Mirror":
        this.hp = isColossus ? 3 : 1;
        this.radius = 18 * scale;
        this.color = "rgba(200,230,255,0.6)";
        break;
      case "Common":
      default:
        this.hp = isColossus ? 2 : 1;
        this.radius = 15 * scale;
        this.color = "#1E8E63";
        break;
    }
  }

  update(dt: number) {
    this.y += this.vy * dt;
    this.x += this.vx * dt;
    this.vx *= 0.94;
    this.pulseT += dt * 3;
    this.iridT += dt * 1.2;
    this.hitFlash = Math.max(0, this.hitFlash - dt * 8);

    if (this.zigzag) {
      this.zigzagT += dt * 2.2;
      this.x += Math.sin(this.zigzagT) * this.zigzagAmp * dt;
    }
  }

  flash() {
    this.hitFlash = 1;
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.save();

    if (this.hitFlash > 0) {
      ctx.globalAlpha = 1;
      ctx.filter = `brightness(${1 + this.hitFlash * 3})`;
    }

    const pulse = Math.sin(this.pulseT) * 1.5;

    if (this.type === "Crystal") {
      this.renderCrystal(ctx, pulse);
    } else if (this.type === "Volatile") {
      this.renderVolatile(ctx, pulse);
    } else if (this.type === "Mirror") {
      this.renderMirror(ctx);
    } else {
      this.renderCommon(ctx, pulse);
    }

    // Colossus crown indicator
    if (this.isColossus) {
      this.renderColossusCrown(ctx);
    }

    ctx.restore();
  }

  private renderColossusCrown(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const r = this.radius;
    ctx.strokeStyle = "rgba(255,220,80,0.85)";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    const points = 5;
    for (let i = 0; i <= points; i++) {
      const a = (Math.PI * 2 * i) / points - Math.PI / 2;
      const rr = i % 2 === 0 ? r + 10 : r + 4;
      const px = this.x + Math.cos(a) * rr;
      const py = this.y + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  private renderCommon(ctx: CanvasRenderingContext2D, pulse: number) {
    const r = this.radius + pulse;
    const grad = ctx.createRadialGradient(
      this.x - r * 0.3,
      this.y - r * 0.3,
      r * 0.1,
      this.x,
      this.y,
      r
    );
    grad.addColorStop(0, this.isColossus ? "#14a870" : "#28c27a");
    grad.addColorStop(0.7, this.isColossus ? "#0a5c38" : this.color);
    grad.addColorStop(1, this.isColossus ? "#051e12" : "#0a3d22");

    ctx.shadowColor = this.isColossus ? "#0a5c38" : "#1E8E63";
    ctx.shadowBlur = this.isColossus ? 24 : 12;

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(244,251,246,0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x - r * 0.2, this.y - r * 0.2, r * 0.35, Math.PI * 1.1, Math.PI * 1.7);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + r + 3, r * 0.8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderCrystal(ctx: CanvasRenderingContext2D, pulse: number) {
    const r = this.radius + pulse * 0.5;
    const sides = 6;
    ctx.shadowColor = this.isColossus ? "#5eceaf" : "#A8F0D0";
    ctx.shadowBlur = this.isColossus ? 22 : 14;

    // Inner glow
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r);
    grad.addColorStop(0, this.isColossus ? "#8eeedd" : "#d0fff0");
    grad.addColorStop(0.5, this.isColossus ? "#5eceaf" : "#A8F0D0");
    grad.addColorStop(1, this.isColossus ? "#2a7a60" : "#4aac82");
    ctx.fillStyle = grad;

    ctx.strokeStyle = "rgba(244,251,246,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (Math.PI / sides) * 2 * i - Math.PI / 2;
      const pr = i % 2 === 0 ? r : r * 0.65;
      const px = this.x + Math.cos(angle) * pr;
      const py = this.y + Math.sin(angle) * pr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (this.cracked || (this.hp <= 1 && !this.isColossus)) {
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(this.x - 4, this.y - r * 0.5);
      ctx.lineTo(this.x + 2, this.y);
      ctx.lineTo(this.x - 3, this.y + r * 0.4);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + r + 3, r * 0.8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderVolatile(ctx: CanvasRenderingContext2D, pulse: number) {
    const r = this.radius + Math.abs(pulse) * 1.5;
    const spikes = 8;
    ctx.shadowColor = "#FF9A3C";
    ctx.shadowBlur = this.isColossus ? 28 : 18;

    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r);
    grad.addColorStop(0, this.isColossus ? "#ffe066" : "#FFD07A");
    grad.addColorStop(0.5, this.isColossus ? "#e06010" : "#FF9A3C");
    grad.addColorStop(1, this.isColossus ? "#a03000" : "#CC5500");
    ctx.fillStyle = grad;

    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (Math.PI / spikes) * i - Math.PI / 2;
      const pr = i % 2 === 0 ? r : r * 0.6;
      const px = this.x + Math.cos(angle) * pr;
      const py = this.y + Math.sin(angle) * pr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + r + 3, r * 0.8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderMirror(ctx: CanvasRenderingContext2D) {
    const r = this.radius;
    const shimmer = (Math.sin(this.iridT) + 1) / 2;
    const shimmer2 = (Math.sin(this.iridT * 1.3 + 1) + 1) / 2;

    ctx.shadowColor = "rgba(150,200,255,0.8)";
    ctx.shadowBlur = this.isColossus ? 24 : 16;

    // Iridescent fill
    const grad = ctx.createRadialGradient(this.x - r * 0.2, this.y - r * 0.2, 0, this.x, this.y, r);
    grad.addColorStop(0, `rgba(255,255,255,${0.5 + shimmer * 0.3})`);
    grad.addColorStop(0.4, `rgba(${130 + shimmer2 * 80},${200 + shimmer * 40},255,${0.4 + shimmer * 0.2})`);
    grad.addColorStop(1, `rgba(80,120,200,${0.2 + shimmer * 0.15})`);
    ctx.fillStyle = grad;

    ctx.strokeStyle = `rgba(200,240,255,${0.6 + shimmer * 0.3})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = `rgba(255,255,255,${0.15 + shimmer * 0.25})`;
    ctx.beginPath();
    ctx.arc(this.x + r * 0.15, this.y - r * 0.15, r * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + r + 3, r * 0.8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
