export class Tideline {
  y: number;
  baseY: number;
  waveOffset: number = 0;
  amplitude: number = 8;
  hasBreach: boolean = false;
  breachCount: number = 0;
  maxBreaches: number = 34;

  constructor(startY: number) {
    this.y = startY;
    this.baseY = startY;
  }

  get healthRatio(): number {
    return Math.max(0, 1 - this.breachCount / this.maxBreaches);
  }

  breach() {
    this.y -= 18;
    this.breachCount++;
    this.amplitude = Math.min(30, this.amplitude + 2.5);
    this.hasBreach = true;
  }

  update(dt: number) {
    this.waveOffset += dt * 1.8;
  }

  getWaveY(x: number): number {
    return (
      this.y +
      Math.sin(x * 0.04 + this.waveOffset) * this.amplitude +
      Math.sin(x * 0.02 + this.waveOffset * 0.7) * (this.amplitude * 0.4)
    );
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // Ocean body
    const dangerRatio = 1 - this.healthRatio;
    const r = Math.floor(14 + dangerRatio * 40);
    const g = Math.floor(60 - dangerRatio * 20);
    const b = Math.floor(44 - dangerRatio * 10);
    ctx.fillStyle = `rgba(${r},${g},${b},0.88)`;
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 8) {
      const cy = this.getWaveY(x);
      if (x === 0) ctx.moveTo(x, cy);
      else ctx.lineTo(x, cy);
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Foam crest
    ctx.save();
    const foamAlpha = 0.55 + dangerRatio * 0.3;
    ctx.strokeStyle = `rgba(244,251,246,${foamAlpha})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = dangerRatio > 0.5 ? "#FF6B6B" : "#F4FBF6";
    ctx.shadowBlur = dangerRatio > 0.5 ? 14 : 8;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 8) {
      const cy = this.getWaveY(x);
      if (x === 0) ctx.moveTo(x, cy);
      else ctx.lineTo(x, cy);
    }
    ctx.stroke();
    ctx.restore();

    // Secondary foam layer
    ctx.save();
    ctx.strokeStyle = `rgba(89,217,142,${0.25 + dangerRatio * 0.2})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 16]);
    ctx.beginPath();
    for (let x = 0; x <= width; x += 8) {
      const cy = this.getWaveY(x) + 8;
      if (x === 0) ctx.moveTo(x, cy);
      else ctx.lineTo(x, cy);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Danger turbulence
    if (this.amplitude > 14) {
      ctx.save();
      ctx.strokeStyle = `rgba(${dangerRatio > 0.6 ? "255,100,100" : "89,217,142"},${(this.amplitude - 14) / 30})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 14]);
      ctx.beginPath();
      for (let x = 0; x <= width; x += 8) {
        const cy = this.getWaveY(x) - 10;
        if (x === 0) ctx.moveTo(x, cy);
        else ctx.lineTo(x, cy);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }
}
