import { InputManager } from "./InputManager";
import { ParticleSystem } from "./ParticleSystem";
import { audioManager } from "./AudioManager";
import { Turret } from "../entities/Turret";
import { Tideline } from "../entities/Tideline";
import { Shot } from "../entities/Shot";
import { Slime, SlimeType } from "../entities/Slime";
import { waveFormations, type WaveFormation } from "../data/waveFormations";

interface Bubble {
  x: number;
  y: number;
  r: number;
  vy: number;
  alpha: number;
  t: number;
}

interface WaveAnnouncement {
  text: string;
  alpha: number;
  isBoss: boolean;
}

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  input: InputManager;
  particles: ParticleSystem;

  turret: Turret;
  tideline: Tideline;
  shots: Shot[] = [];
  slimes: Slime[] = [];

  score: number = 0;
  pearls: number = 0;
  wave: number = 1;
  isGameOver: boolean = false;
  paused: boolean = false;
  upgrades: Record<string, boolean> = {};

  lastTime: number = 0;
  waveTimer: number = 0;
  formationQueue: Array<{ x: number; type: SlimeType; delay: number; zigzag?: boolean }> = [];
  formationTimer: number = 0;
  formationIndex: number = 0;
  screenShake: number = 0;
  hitFlashAlpha: number = 0;
  waveAnnouncement: WaveAnnouncement | null = null;

  private bgBubbles: Bubble[] = [];
  private bubbleTimer: number = 0;
  private bgOffset: number = 0;
  private stars: Array<{ x: number; y: number; r: number; alpha: number }> = [];

  onGameOver: () => void;

  constructor(canvas: HTMLCanvasElement, onGameOver: () => void, initialPearls = 0, savedUpgrades: Record<string, boolean> = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.input = new InputManager(canvas);
    this.particles = new ParticleSystem();
    this.onGameOver = onGameOver;
    this.pearls = initialPearls;
    this.upgrades = savedUpgrades;

    this.turret = new Turret(canvas.width / 2, canvas.height * 0.9);
    this.turret.hasTwinTurret = !!savedUpgrades["twin_turret"];
    this.turret.hasCoralSkin = !!savedUpgrades["coral_skin"];

    this.tideline = new Tideline(canvas.height * 0.82);

    this.lastTime = performance.now();
    this.initBackground();
    this.spawnNextFormation();
    this.showWaveAnnouncement();
  }

  private initBackground() {
    const W = this.canvas.width;
    const H = this.canvas.height;
    for (let i = 0; i < 60; i++) {
      this.stars.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.7,
        r: 0.5 + Math.random() * 1.5,
        alpha: 0.1 + Math.random() * 0.4,
      });
    }
  }

  private showWaveAnnouncement() {
    const formation = waveFormations.find(f => f.minWave <= this.wave);
    const isBoss = waveFormations.find(f => f.minWave === this.wave && f.isBossWave) !== undefined;
    this.waveAnnouncement = {
      text: `WAVE ${this.wave}${isBoss ? " — BOSS" : ""}`,
      alpha: 1,
      isBoss,
    };
  }

  private spawnNextFormation() {
    const speedMult = this.upgrades["slower_tide"] ? 0.8 : 1.0;
    const available = waveFormations.filter((f) => f.minWave <= this.wave);
    const formation = available[Math.floor(Math.random() * available.length)] ?? waveFormations[0];
    this.formationQueue = formation.spawns.map((s) => ({
      x: s.x,
      type: s.type,
      delay: s.delay,
      zigzag: s.zigzag,
      _speed: (s.speed ?? (40 + this.wave * 6)) * speedMult,
    } as { x: number; type: SlimeType; delay: number; zigzag?: boolean; _speed?: number }));
    this.formationIndex = 0;
    this.formationTimer = 0;
  }

  update(time: number) {
    if (this.isGameOver || this.paused) return;
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    this.screenShake = Math.max(0, this.screenShake - dt * 90);
    this.hitFlashAlpha = Math.max(0, this.hitFlashAlpha - dt * 4);
    this.bgOffset += dt * 0.4;

    if (this.waveAnnouncement) {
      this.waveAnnouncement.alpha -= dt * 0.6;
      if (this.waveAnnouncement.alpha <= 0) this.waveAnnouncement = null;
    }

    this.input.update();
    this.turret.update(this.input, dt);

    if (this.input.fireTriggered) {
      const isCharged = this.input.isCharging;
      this.shots.push(new Shot(this.turret.x, this.turret.y, this.input.aimAngle, isCharged));

      if (this.upgrades["twin_turret"]) {
        this.shots.push(new Shot(this.turret.x - 48, this.turret.y, this.input.aimAngle, isCharged));
      }

      if (isCharged && this.upgrades["wider_charge"]) {
        const spread = 0.22;
        this.shots.push(new Shot(this.turret.x, this.turret.y, this.input.aimAngle + spread, isCharged));
        this.shots.push(new Shot(this.turret.x, this.turret.y, this.input.aimAngle - spread, isCharged));
      }

      if (isCharged) audioManager.playCharge();
      else audioManager.playFire();
    }

    this.tideline.update(dt);
    this.particles.update(dt);

    // Background bubbles
    this.bubbleTimer += dt;
    if (this.bubbleTimer > 0.3) {
      this.bubbleTimer = 0;
      this.bgBubbles.push({
        x: Math.random() * this.canvas.width,
        y: this.tideline.y + 20 + Math.random() * 80,
        r: 2 + Math.random() * 6,
        vy: -(15 + Math.random() * 25),
        alpha: 0.15 + Math.random() * 0.2,
        t: 0,
      });
    }
    for (let i = this.bgBubbles.length - 1; i >= 0; i--) {
      const b = this.bgBubbles[i];
      b.y += b.vy * dt;
      b.t += dt;
      b.alpha -= dt * 0.08;
      if (b.alpha <= 0 || b.y < 0) this.bgBubbles.splice(i, 1);
    }

    // Shots
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const shot = this.shots[i];
      shot.update(dt, this.canvas.width);
      if (shot.shouldSpawnTrail(dt)) {
        this.particles.spawnTrail(shot.x, shot.y, shot.isCharged);
      }
      if (shot.y < -20) this.shots.splice(i, 1);
    }

    // Formation spawning
    if (this.formationQueue.length > 0) {
      this.formationTimer += dt;
      while (
        this.formationIndex < this.formationQueue.length &&
        this.formationQueue[this.formationIndex].delay <= this.formationTimer
      ) {
        const spawn = this.formationQueue[this.formationIndex] as { x: number; type: SlimeType; delay: number; zigzag?: boolean; _speed?: number };
        const x = spawn.x * this.canvas.width;
        const speed = (spawn as { _speed?: number })._speed ?? (40 + this.wave * 6);
        const slime = new Slime(x, -40, spawn.type, speed, false, spawn.zigzag ?? false);
        this.slimes.push(slime);
        this.formationIndex++;
      }
      if (this.formationIndex >= this.formationQueue.length) {
        this.formationTimer = 0;
        this.formationIndex = 0;
        this.formationQueue = [];
      }
    } else {
      this.waveTimer += dt;
      if (this.waveTimer > 3.5) {
        this.waveTimer = 0;
        this.wave++;
        this.score += 500 + this.wave * 50;
        this.pearls += 5 + Math.floor(this.wave / 2);
        audioManager.playWaveClear();
        this.spawnNextFormation();
        this.showWaveAnnouncement();
      }
    }

    // Slime-slime fusion
    for (let i = 0; i < this.slimes.length; i++) {
      for (let j = i + 1; j < this.slimes.length; j++) {
        const a = this.slimes[i];
        const b = this.slimes[j];
        if (a.isColossus || b.isColossus) continue;
        if (a.type !== b.type) continue;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        if (dx * dx + dy * dy < (a.radius + b.radius) ** 2) {
          const cx = (a.x + b.x) / 2;
          const cy = (a.y + b.y) / 2;
          const colossus = new Slime(cx, cy, a.type, a.vy * 0.65, true);
          this.slimes.splice(j, 1);
          this.slimes.splice(i, 1);
          this.slimes.push(colossus);
          this.particles.spawnFusion(cx, cy);
          break;
        }
      }
    }

    const newSlimes: Slime[] = [];

    for (let i = this.slimes.length - 1; i >= 0; i--) {
      const slime = this.slimes[i];
      slime.update(dt);

      // Keep slimes within canvas
      if (slime.x < slime.radius) slime.x = slime.radius;
      if (slime.x > this.canvas.width - slime.radius) slime.x = this.canvas.width - slime.radius;

      if (slime.y > this.tideline.getWaveY(slime.x)) {
        this.tideline.breach();
        this.hitFlashAlpha = 0.4;
        this.particles.spawnFoam(slime.x, this.tideline.y);
        audioManager.playTideRise();
        this.slimes.splice(i, 1);
        if (this.tideline.y < this.canvas.height * 0.18) {
          this.isGameOver = true;
          this.onGameOver();
        }
        continue;
      }

      for (let j = this.shots.length - 1; j >= 0; j--) {
        const shot = this.shots[j];
        const dx = slime.x - shot.x;
        const dy = slime.y - shot.y;
        const hitRadius = (slime.radius + shot.radius) ** 2;
        if (dx * dx + dy * dy > hitRadius) continue;

        if (slime.type === "Mirror" && !shot.isSplit) {
          const a1 = shot.angle + 0.32;
          const a2 = shot.angle - 0.32;
          this.shots.push(new Shot(shot.x, shot.y, a1, shot.isCharged, true));
          this.shots.push(new Shot(shot.x, shot.y, a2, shot.isCharged, true));
          this.shots.splice(j, 1);
          continue;
        }

        const damage = shot.isCharged ? 2 : 1;
        slime.hp -= damage;
        slime.flash();
        if (!shot.isCharged) this.shots.splice(j, 1);

        if (slime.hp <= 0) {
          if (slime.type === "Crystal") {
            this.particles.spawnPop(slime.x, slime.y, slime.color, slime.isColossus);
            this.particles.spawnSpark(slime.x, slime.y);
          } else if (slime.type === "Volatile") {
            this.particles.spawnFire(slime.x, slime.y);
            this.particles.spawnPop(slime.x, slime.y, slime.color, slime.isColossus);
          } else {
            this.particles.spawnPop(slime.x, slime.y, slime.color, slime.isColossus);
          }
          audioManager.playPop();

          if (slime.isColossus) {
            this.screenShake = 14;
            audioManager.playColossusDeath();
            const count = 2 + Math.floor(Math.random() * 2);
            for (let k = 0; k < count; k++) {
              const angle = (Math.PI * 2 * k) / count + Math.random() * 0.5;
              const child = new Slime(slime.x, slime.y, slime.type, slime.vy * 1.25);
              child.vx = Math.cos(angle) * 90;
              newSlimes.push(child);
            }
            this.score += 500;
            this.pearls += 6;
          } else if (slime.type === "Volatile") {
            for (let k = this.slimes.length - 1; k >= 0; k--) {
              const nearby = this.slimes[k];
              if (nearby === slime) continue;
              if (nearby.type !== "Common") continue;
              const dx2 = nearby.x - slime.x;
              const dy2 = nearby.y - slime.y;
              if (dx2 * dx2 + dy2 * dy2 < 90 * 90) {
                this.particles.spawnFire(nearby.x, nearby.y);
                this.particles.spawnPop(nearby.x, nearby.y, nearby.color);
                this.slimes.splice(k, 1);
                this.score += 120;
                this.pearls += 1;
              }
            }
            this.score += 200;
            this.pearls += 2;
          } else {
            this.score += 100 + this.wave * 5;
            this.pearls += 1;
          }

          this.slimes.splice(i, 1);
        }
        break;
      }
    }

    for (const s of newSlimes) this.slimes.push(s);
  }

  render() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;

    ctx.save();
    if (this.screenShake > 0) {
      ctx.translate(
        (Math.random() - 0.5) * this.screenShake,
        (Math.random() - 0.5) * this.screenShake
      );
    }

    // Deep ocean background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#040e0a");
    grad.addColorStop(0.4, "#071f16");
    grad.addColorStop(0.75, "#0B3D2E");
    grad.addColorStop(1, "#0f4a38");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Bioluminescent god rays
    this.renderGodRays(ctx, W, H);

    // Background stars/particles
    for (const s of this.stars) {
      const flicker = 0.7 + Math.sin(this.bgOffset * 1.5 + s.x) * 0.3;
      ctx.globalAlpha = s.alpha * flicker;
      ctx.fillStyle = "#A8F0D0";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Underwater bubbles
    for (const b of this.bgBubbles) {
      ctx.globalAlpha = b.alpha;
      ctx.strokeStyle = "rgba(168,240,208,0.7)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Distant sand
    const sandGrad = ctx.createLinearGradient(0, H * 0.78, 0, H);
    sandGrad.addColorStop(0, "rgba(232,217,166,0.0)");
    sandGrad.addColorStop(1, "rgba(232,217,166,0.15)");
    ctx.fillStyle = sandGrad;
    ctx.fillRect(0, H * 0.78, W, H * 0.22);

    // Coral silhouettes on sand
    this.renderCoralSilhouettes(ctx, W, H);

    // Tideline
    this.tideline.render(ctx, W, H);

    // Slimes
    for (const slime of this.slimes) slime.render(ctx);

    // Shots
    for (const shot of this.shots) shot.render(ctx);

    // Particles
    this.particles.render(ctx);

    // Turret
    this.turret.render(ctx);

    // Aim preview
    if (this.input.touch.isDown && !this.input.isCharging) {
      ctx.save();
      ctx.setLineDash([4, 12]);
      ctx.strokeStyle = "rgba(89,217,142,0.45)";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#59D98E";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      for (let i = 0; i <= 14; i++) {
        const t = i / 14;
        const px = this.turret.x + Math.cos(this.input.aimAngle) * t * 220;
        const py = this.turret.y + Math.sin(this.input.aimAngle) * t * 220;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Charge arc
    if (this.input.isCharging) {
      ctx.save();
      ctx.setLineDash([6, 8]);
      ctx.strokeStyle = `rgba(89,217,142,${0.7 + this.turret.chargeRatio * 0.3})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = "#59D98E";
      ctx.shadowBlur = 16;
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        const px = this.turret.x + Math.cos(this.input.aimAngle) * t * W * 0.75;
        const py = this.turret.y + Math.sin(this.input.aimAngle) * t * W * 0.75;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Tide breach flash
    if (this.hitFlashAlpha > 0) {
      ctx.fillStyle = `rgba(255,60,60,${this.hitFlashAlpha * 0.35})`;
      ctx.fillRect(0, 0, W, H);
    }

    // HUD
    this.renderHUD(ctx, W, H);

    // Wave announcement
    if (this.waveAnnouncement && this.waveAnnouncement.alpha > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.waveAnnouncement.alpha);
      const isBoss = this.waveAnnouncement.isBoss;
      ctx.font = `bold ${isBoss ? 32 : 26}px 'Bungee', 'Space Mono', monospace`;
      ctx.textAlign = "center";
      ctx.shadowColor = isBoss ? "#FF9A3C" : "#59D98E";
      ctx.shadowBlur = 20;
      ctx.fillStyle = isBoss ? "#FF9A3C" : "#59D98E";
      ctx.fillText(this.waveAnnouncement.text, W / 2, H * 0.22);
      ctx.restore();
    }

    ctx.restore();
  }

  private renderGodRays(ctx: CanvasRenderingContext2D, W: number, H: number) {
    ctx.save();
    const rayCount = 5;
    for (let i = 0; i < rayCount; i++) {
      const xBase = W * (0.1 + (i / rayCount) * 0.8);
      const angle = -Math.PI / 2 + (Math.sin(this.bgOffset * 0.3 + i) * 0.15);
      const len = H * 0.5;
      const alpha = 0.015 + Math.sin(this.bgOffset * 0.5 + i * 1.3) * 0.008;
      const grad = ctx.createLinearGradient(xBase, 0, xBase + Math.tan(angle) * len, len);
      grad.addColorStop(0, `rgba(89,217,142,${alpha})`);
      grad.addColorStop(1, "rgba(89,217,142,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      const w = 30 + i * 15;
      ctx.moveTo(xBase - w / 2, 0);
      ctx.lineTo(xBase + w / 2, 0);
      ctx.lineTo(xBase + w / 2 + Math.tan(angle) * len, len);
      ctx.lineTo(xBase - w / 2 + Math.tan(angle) * len, len);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private renderCoralSilhouettes(ctx: CanvasRenderingContext2D, W: number, H: number) {
    ctx.save();
    ctx.fillStyle = "rgba(10,30,20,0.6)";

    const corals = [
      { x: 0.08 * W, y: H, branches: 4, height: H * 0.06 },
      { x: 0.22 * W, y: H, branches: 3, height: H * 0.04 },
      { x: 0.72 * W, y: H, branches: 5, height: H * 0.07 },
      { x: 0.88 * W, y: H, branches: 3, height: H * 0.05 },
    ];

    for (const c of corals) {
      ctx.beginPath();
      ctx.moveTo(c.x - 8, c.y);
      ctx.lineTo(c.x - 4, c.y - c.height * 0.4);
      ctx.lineTo(c.x, c.y - c.height);
      ctx.lineTo(c.x + 4, c.y - c.height * 0.4);
      ctx.lineTo(c.x + 8, c.y);
      ctx.fill();
      for (let b = 0; b < c.branches; b++) {
        const bx = c.x + (Math.random() - 0.5) * 20;
        const by = c.y - c.height * (0.3 + Math.random() * 0.5);
        const blen = c.height * (0.2 + Math.random() * 0.3);
        const ang = (Math.random() - 0.5) * Math.PI;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + Math.cos(ang) * blen, by + Math.sin(ang) * blen * 0.5 - blen * 0.2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(10,30,20,0.5)";
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private renderHUD(ctx: CanvasRenderingContext2D, W: number, H: number) {
    ctx.save();
    ctx.shadowBlur = 0;

    // Top bar background
    ctx.fillStyle = "rgba(4,14,10,0.6)";
    ctx.fillRect(0, 0, W, 52);

    // Score
    ctx.fillStyle = "rgba(244,251,246,0.95)";
    ctx.font = "bold 16px 'Space Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText(`SCORE  ${this.score.toLocaleString()}`, 14, 32);

    // Wave
    ctx.textAlign = "right";
    ctx.fillText(`WAVE ${this.wave}`, W - 14, 32);

    // Pearls
    ctx.fillStyle = "rgba(89,217,142,0.9)";
    ctx.font = "13px 'Space Mono', monospace";
    ctx.fillText(`${this.pearls} ◉`, W - 14, 48);

    // Tide health bar
    const barW = Math.min(W * 0.5, 200);
    const barH = 8;
    const barX = W / 2 - barW / 2;
    const barY = 34;
    const health = this.tideline.healthRatio;

    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 4);
    ctx.fill();

    const healthColor = health > 0.6
      ? "#59D98E"
      : health > 0.3
      ? "#FFD07A"
      : "#FF6B6B";

    ctx.fillStyle = healthColor;
    if (health < 0.3) {
      ctx.shadowColor = "#FF6B6B";
      ctx.shadowBlur = 8;
    }
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * health, barH, 4);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(244,251,246,0.5)";
    ctx.font = "9px 'Space Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("TIDELINE", W / 2, barY - 4);

    ctx.restore();
  }

  cleanup() {
    this.input.cleanup();
  }
}
