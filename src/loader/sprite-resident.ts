import type { ImportedResidentPack } from './pack-importer';
import type { LoaderSettings } from './settings';
import { getAnimationFrames, getSpriteFramePosition, type ResidentAnimation } from './sprite-grid';

interface Point {
  x: number;
  y: number;
}

export class SpriteResident {
  private readonly node: HTMLButtonElement;
  private readonly imageUrl: string;
  private readonly intervalId: number;
  private frameOffset = 0;
  private tickCount = 0;
  private animation: ResidentAnimation = 'idle';
  private walkDirection: -1 | 1 = -1;
  private dragging = false;
  private dragMoved = false;
  private dragOffset: Point = { x: 0, y: 0 };

  constructor(
    private readonly options: {
      pack: ImportedResidentPack;
      settings: LoaderSettings;
      onOpen: () => void;
      onPositionChange: (viewport: 'desktop' | 'mobile', point: Point) => void;
    },
  ) {
    const imageBuffer = new ArrayBuffer(options.pack.spritesheet.byteLength);
    new Uint8Array(imageBuffer).set(options.pack.spritesheet);
    this.imageUrl = URL.createObjectURL(new Blob([imageBuffer], { type: 'image/png' }));
    this.node = document.createElement('button');
    this.node.id = 'resident-loader-pet';
    this.node.type = 'button';
    this.node.setAttribute('aria-label', `打開 ${options.pack.manifest.identity.displayName} 的桌寵面板`);
    this.node.style.backgroundImage = `url("${this.imageUrl}")`;
    this.node.style.opacity = String(options.settings.appearance.opacity);
    this.node.addEventListener('click', this.handleClick);
    this.node.addEventListener('pointerdown', this.handlePointerDown);
    this.node.addEventListener('pointermove', this.handlePointerMove);
    this.node.addEventListener('pointerup', this.handlePointerUp);
    this.node.addEventListener('pointercancel', this.handlePointerUp);
    window.addEventListener('resize', this.handleResize);

    document.body.append(this.node);
    this.applySizeAndPosition();
    this.renderFrame();
    this.intervalId = window.setInterval(
      () => this.tick(),
      options.settings.motion.frameIntervalMs,
    );
  }

  destroy(): void {
    window.clearInterval(this.intervalId);
    window.removeEventListener('resize', this.handleResize);
    this.node.removeEventListener('click', this.handleClick);
    this.node.removeEventListener('pointerdown', this.handlePointerDown);
    this.node.removeEventListener('pointermove', this.handlePointerMove);
    this.node.removeEventListener('pointerup', this.handlePointerUp);
    this.node.removeEventListener('pointercancel', this.handlePointerUp);
    this.node.remove();
    URL.revokeObjectURL(this.imageUrl);
  }

  private viewport(): 'desktop' | 'mobile' {
    return window.matchMedia('(max-width: 720px)').matches ? 'mobile' : 'desktop';
  }

  private size(): number {
    const percent =
      this.viewport() === 'mobile'
        ? this.options.settings.appearance.mobileSizePercent
        : this.options.settings.appearance.desktopSizePercent;
    return Math.round(128 * (percent / 100));
  }

  private clamp(point: Point): Point {
    const size = this.size();
    return {
      x: Math.max(8, Math.min(window.innerWidth - size - 8, point.x)),
      y: Math.max(8, Math.min(window.innerHeight - size - 8, point.y)),
    };
  }

  private point(): Point {
    return {
      x: Number.parseFloat(this.node.style.left) || 8,
      y: Number.parseFloat(this.node.style.top) || 8,
    };
  }

  private setPoint(point: Point): void {
    const safe = this.clamp(point);
    this.node.style.left = `${safe.x}px`;
    this.node.style.top = `${safe.y}px`;
  }

  private applySizeAndPosition(): void {
    const size = this.size();
    this.node.style.width = `${size}px`;
    this.node.style.height = `${size}px`;
    const saved = this.options.settings.position[this.viewport()];
    this.setPoint({
      x: saved.x ?? window.innerWidth - size - 24,
      y: saved.y ?? window.innerHeight - size - 24,
    });
  }

  private renderFrame(): void {
    const frames = getAnimationFrames(this.animation);
    const frame = frames[this.frameOffset % frames.length] ?? frames[0];
    const position = getSpriteFramePosition(frame);
    this.node.style.backgroundPosition = `${position.xPercent}% ${position.yPercent}%`;
  }

  private tick(): void {
    if (this.dragging) return;
    this.tickCount += 1;
    this.frameOffset = (this.frameOffset + 1) % 8;

    const cycle = this.tickCount % 64;
    if (cycle === 0) {
      this.walkDirection = this.point().x < window.innerWidth / 2 ? 1 : -1;
    }
    const walking = cycle >= 32 && cycle < 56;
    this.animation = walking
      ? this.walkDirection === 1
        ? 'walk-right'
        : 'walk-left'
      : 'idle';
    if (walking) {
      const distance =
        this.options.settings.motion.walkSpeedPxPerSec *
        (this.options.settings.motion.frameIntervalMs / 1_000) *
        this.walkDirection;
      const before = this.point();
      const after = this.clamp({ x: before.x + distance, y: before.y });
      if (Math.abs(after.x - (before.x + distance)) > 0.5) this.walkDirection *= -1;
      this.setPoint(after);
    }
    this.renderFrame();
  }

  private readonly handleResize = (): void => {
    this.applySizeAndPosition();
  };

  private readonly handleClick = (): void => {
    if (this.dragMoved) {
      this.dragMoved = false;
      return;
    }
    this.options.onOpen();
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    const rect = this.node.getBoundingClientRect();
    this.dragging = true;
    this.dragMoved = false;
    this.dragOffset = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    this.node.setPointerCapture?.(event.pointerId);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.dragging) return;
    const next = { x: event.clientX - this.dragOffset.x, y: event.clientY - this.dragOffset.y };
    const current = this.point();
    if (Math.abs(next.x - current.x) + Math.abs(next.y - current.y) > 3) this.dragMoved = true;
    this.setPoint(next);
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (!this.dragging) return;
    this.dragging = false;
    this.node.releasePointerCapture?.(event.pointerId);
    if (this.dragMoved) this.options.onPositionChange(this.viewport(), this.point());
  };
}
