import { InputManager } from "../engine/InputManager";

export class Turret {
  x: number;
  y: number;
  angle: number = -Math.PI / 2;
  chargeRatio: number = 0;
  hasTwinTurret: boolean = false;
  hasCoralSkin: boolean = false;
  private pulseT: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(input: InputManager, dt: number) {
    this.angle = input.aimAngle;
    this.pulseT += dt * 4;
    if (input.isCharging) {
      this.chargeRatio = Math.min(1, this.chargeRatio + dt * 2.5);
    } else {
      this.chargeRatio = Math.max(0, this.chargeRatio - dt * 6);
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    this.renderTurretAt(ctx, this.x, this.y);
    if (this.hasTwinTurret) {
      this.renderTurretAt(ctx, this.x - 48, this.y, 0.7);
    }
  }

  private renderTurretAt(ctx: CanvasRenderingContext2D, tx: number, ty: number, scale = 1) {
    ctx.save();
    ctx.translate(tx, ty);

    const baseColor = this.hasCoralSkin ? "#FF7A5C" : "#FF6F59";
    const baseAccent = this.hasCoralSkin ? "#FF9A7A" : "#FF8570";
    const barrelColor = this.hasCoralSkin ? "#D4C49A" : "#E8D9A6";

    // Outer glow ring when charging
    if (this.chargeRatio > 0) {
      const pulse = Math.sin(this.pulseT) * 0.3 + 0.7;
      ctx.shadowColor = "#59D98E";
      ctx.shadowBlur = 30 * this.chargeRatio * pulse;
      ctx.strokeStyle = `rgba(89,217,142,${this.chargeRatio * 0.4 * pulse})`;
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, (28 + this.chargeRatio * 8) * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Platform base — hexagonal coral mount
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 10;
    const baseR = 22 * scale;
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      const px = Math.cos(a) * baseR;
      const py = Math.sin(a) * baseR * 0.6;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Base highlight
    ctx.fillStyle = baseAccent;
    ctx.beginPath();
    ctx.ellipse(0, -4 * scale, 10 * scale, 5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Barrel (rotates with aim)
    ctx.rotate(this.angle + Math.PI / 2);

    // Barrel body
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 6;
    const bw = 9 * scale;
    const bh = 34 * scale;

    // Barrel gradient
    const bGrad = ctx.createLinearGradient(-bw, -bh, bw, -bh);
    bGrad.addColorStop(0, barrelColor);
    bGrad.addColorStop(0.5, "#F4EBB8");
    bGrad.addColorStop(1, "#C4B880");
    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.roundRect(-bw, -bh, bw * 2, bh, [4 * scale, 4 * scale, 0, 0]);
    ctx.fill();

    // Barrel ring accent
    ctx.fillStyle = baseColor;
    ctx.fillRect(-bw - 2 * scale, -bh * 0.55, (bw + 2 * scale) * 2, 5 * scale);

    // Muzzle tip
    ctx.fillStyle = this.chargeRatio > 0 ? "#59D98E" : barrelColor;
    if (this.chargeRatio > 0) {
      ctx.shadowColor = "#59D98E";
      ctx.shadowBlur = 14 * this.chargeRatio;
    }
    ctx.beginPath();
    ctx.roundRect(-bw * 1.2, -bh - 4 * scale, bw * 2.4, 6 * scale, 3 * scale);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Charge energy orb at muzzle
    if (this.chargeRatio > 0.3) {
      const orbR = (5 + this.chargeRatio * 8) * scale;
      const pulse = Math.sin(this.pulseT * 2) * 0.2 + 0.8;
      ctx.shadowColor = "#59D98E";
      ctx.shadowBlur = 20 * this.chargeRatio;
      ctx.fillStyle = `rgba(89,217,142,${this.chargeRatio * 0.85 * pulse})`;
      ctx.beginPath();
      ctx.arc(0, -bh - 4 * scale, orbR, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }
}
