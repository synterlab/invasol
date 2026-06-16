interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  decay: number;
  color: string;
  type: "pop" | "foam" | "fusion" | "trail" | "spark" | "fire" | "bubble";
}

export class ParticleSystem {
  private particles: Particle[] = [];

  spawnPop(x: number, y: number, color: string, isColossus = false) {
    const count = isColossus ? 20 : 10 + Math.floor(Math.random() * 6);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = (isColossus ? 100 : 60) + Math.random() * (isColossus ? 160 : 100);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: (isColossus ? 5 : 3) + Math.random() * (isColossus ? 8 : 5),
        alpha: 1,
        decay: 1.2 + Math.random() * 1.5,
        color,
        type: "pop",
      });
    }
  }

  spawnFoam(x: number, y: number) {
    for (let i = 0; i < 16; i++) {
      const angle = -Math.PI + Math.random() * Math.PI;
      const speed = 50 + Math.random() * 100;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        r: 5 + Math.random() * 8,
        alpha: 0.9,
        decay: 1.0 + Math.random() * 0.8,
        color: "#F4FBF6",
        type: "foam",
      });
    }
  }

  spawnFusion(x: number, y: number) {
    for (let i = 0; i < 18; i++) {
      const angle = (Math.PI * 2 * i) / 18;
      const speed = 40 + Math.random() * 80;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 3 + Math.random() * 5,
        alpha: 0.9,
        decay: 0.7 + Math.random() * 0.8,
        color: i % 2 === 0 ? "#59D98E" : "#A8F0D0",
        type: "fusion",
      });
    }
  }

  spawnTrail(x: number, y: number, isCharged: boolean) {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 4,
      y: y + (Math.random() - 0.5) * 4,
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 20,
      r: isCharged ? 4 + Math.random() * 3 : 2 + Math.random() * 2,
      alpha: isCharged ? 0.7 : 0.4,
      decay: 3 + Math.random() * 3,
      color: isCharged ? "#59D98E" : "#E8D9A6",
      type: "trail",
    });
  }

  spawnSpark(x: number, y: number) {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
      const speed = 80 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 1.5 + Math.random() * 2,
        alpha: 1,
        decay: 2 + Math.random() * 3,
        color: i % 3 === 0 ? "#A8F0D0" : "#ffffff",
        type: "spark",
      });
    }
  }

  spawnFire(x: number, y: number) {
    for (let i = 0; i < 14; i++) {
      const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 1.5;
      const speed = 60 + Math.random() * 100;
      const colors = ["#FF9A3C", "#FF6F22", "#FFCA28", "#FF4500"];
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        r: 3 + Math.random() * 6,
        alpha: 0.9,
        decay: 1.5 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: "fire",
      });
    }
  }

  spawnBubble(x: number, y: number) {
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 12,
      vy: -(8 + Math.random() * 20),
      r: 2 + Math.random() * 5,
      alpha: 0.3 + Math.random() * 0.3,
      decay: 0.08 + Math.random() * 0.1,
      color: "rgba(168,240,208,0.6)",
      type: "bubble",
    });
  }

  update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.type === "fire") {
        p.vy -= 120 * dt;
        p.vx *= 0.98;
      } else if (p.type === "bubble") {
        p.vx *= 0.99;
      } else if (p.type === "spark") {
        p.vy += 80 * dt;
      } else {
        p.vy += 60 * dt;
      }

      p.alpha -= p.decay * dt;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.type === "foam" || p.type === "fusion") {
        ctx.shadowColor = p.type === "fusion" ? "#59D98E" : "#F4FBF6";
        ctx.shadowBlur = 8;
      } else if (p.type === "trail") {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
      } else if (p.type === "spark") {
        ctx.shadowColor = "#A8F0D0";
        ctx.shadowBlur = 6;
      } else if (p.type === "fire") {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
      } else if (p.type === "bubble") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
