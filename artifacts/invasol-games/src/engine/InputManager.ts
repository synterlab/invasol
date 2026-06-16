export interface TouchState {
  isDown: boolean;
  x: number;
  y: number;
  startX: number;
  startY: number;
  duration: number;
}

export class InputManager {
  public touch: TouchState = {
    isDown: false,
    x: 0,
    y: 0,
    startX: 0,
    startY: 0,
    duration: 0,
  };

  public fireTriggered: boolean = false;
  public aimAngle: number = -Math.PI / 2;
  public isCharging: boolean = false;

  private canvas: HTMLCanvasElement;
  private downTime: number = 0;
  private listeners: Array<[EventTarget, string, EventListenerOrEventListenerObject]> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.bindEvents();
  }

  private bindEvents() {
    const handleDown = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const pos = this.getPos(e);

      this.touch.isDown = true;
      this.touch.startX = pos.x;
      this.touch.startY = pos.y;
      this.touch.x = pos.x;
      this.touch.y = pos.y;
      this.downTime = performance.now();
      this.isCharging = false;
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!this.touch.isDown) return;
      const pos = this.getPos(e);
      this.touch.x = pos.x;
      this.touch.y = pos.y;
    };

    const handleUp = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (this.touch.isDown) {
        this.touch.isDown = false;
        this.fireTriggered = true;
      }
      this.isCharging = false;
    };

    this.canvas.addEventListener("mousedown", handleDown, { passive: false });
    this.canvas.addEventListener("mousemove", handleMove, { passive: false });
    window.addEventListener("mouseup", handleUp, { passive: false });
    this.canvas.addEventListener("touchstart", handleDown, { passive: false });
    this.canvas.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleUp, { passive: false });

    this.listeners.push(
      [this.canvas, "mousedown", handleDown],
      [this.canvas, "mousemove", handleMove],
      [window, "mouseup", handleUp],
      [this.canvas, "touchstart", handleDown],
      [this.canvas, "touchmove", handleMove],
      [window, "touchend", handleUp]
    );
  }

  private getPos(e: MouseEvent | TouchEvent) {
    const rect = this.canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ("touches" in e) {
      const t = e.touches[0] ?? (e as TouchEvent).changedTouches[0];
      clientX = t.clientX;
      clientY = t.clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  update() {
    this.fireTriggered = false;
    if (this.touch.isDown) {
      this.touch.duration = performance.now() - this.downTime;
      if (this.touch.duration > 220) {
        this.isCharging = true;
      }

      const dx = this.touch.x - this.touch.startX;
      const dy = this.touch.y - this.touch.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 8) {
        // Slingshot: drag direction is reversed for firing
        this.aimAngle = Math.atan2(dy, dx) - Math.PI;
      } else {
        this.aimAngle = -Math.PI / 2;
      }
    }
  }

  cleanup() {
    for (const [target, type, fn] of this.listeners) {
      target.removeEventListener(type, fn);
    }
    this.listeners = [];
  }
}
