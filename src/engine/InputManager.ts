import { ENGINE_DEBUG_MODE } from "./Constants/Constants";

type TPressState = { isDown: boolean; startTime: number };

class InputManager {
  private keyStates: Map<string, TPressState> = new Map();
  // The key name each physical key (event.code) went down as, so releasing it clears that name
  // even if a modifier changed event.key in between (e.g. "1" down, Shift, "!" up)
  private keyNamesByCode: Map<string, string> = new Map();
  private mouseButtonStates: Map<number, TPressState> = new Map();
  // Keyed by pointerId, so each touch is tracked separately
  private pointerStates: Map<number, { button: number; startTime: number }> =
    new Map();
  private mousePosition: { x: number; y: number } = { x: 0, y: 0 };

  private _initialized: boolean = false;
  private _killFunction: () => void;

  constructor() {}

  public get initialized(): boolean {
    return this._initialized;
  }

  public initialize(): Promise<void> {
    if (this._initialized) return Promise.resolve();

    const releaseAll = () => this.releaseAll();
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") this.releaseAll();
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listeners: Array<[string, (event: any) => void]> = [
      ["keydown", (e: KeyboardEvent) => this.handleKeyDown(e)],
      ["keyup", (e: KeyboardEvent) => this.handleKeyUp(e)],
      ["mousedown", (e: MouseEvent) => this.handleMouseDown(e)],
      ["mouseup", (e: MouseEvent) => this.handleMouseUp(e)],
      ["pointermove", (e: PointerEvent) => this.handlePointerMove(e)],
      ["pointerdown", (e: PointerEvent) => this.handlePointerDown(e)],
      ["pointerup", (e: PointerEvent) => this.handlePointerUp(e)],
      ["pointercancel", (e: PointerEvent) => this.handlePointerUp(e)],
      // Key/button releases are missed while the window doesn't have focus
      ["blur", releaseAll],
    ];
    listeners.forEach(([type, fn]) => window.addEventListener(type, fn));
    document.addEventListener("visibilitychange", onVisibilityChange);
    this._killFunction = () => {
      listeners.forEach(([type, fn]) => window.removeEventListener(type, fn));
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
    this._initialized = true;
    return Promise.resolve();
  }

  /**
   * Removes the event listeners and releases everything that is held
   */
  public destroy(): void {
    this._killFunction?.();
    this._killFunction = undefined;
    this._initialized = false;
    this.releaseAll();
  }

  private releaseAll(): void {
    this.keyStates.forEach((state) => {
      state.isDown = false;
      state.startTime = 0;
    });
    this.keyNamesByCode.clear();
    this.mouseButtonStates.forEach((state) => {
      state.isDown = false;
      state.startTime = 0;
    });
    this.pointerStates.clear();
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    if (event.code) this.keyNamesByCode.set(event.code, key);

    const state = this.keyStates.get(key);
    if (!state) {
      this.keyStates.set(key, { isDown: true, startTime: performance.now() });
    } else if (!state.isDown) {
      // Key repeat keeps the original press time
      state.isDown = true;
      state.startTime = performance.now();
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const keys = new Set([event.key.toLowerCase()]);
    if (event.code && this.keyNamesByCode.has(event.code)) {
      keys.add(this.keyNamesByCode.get(event.code));
      this.keyNamesByCode.delete(event.code);
    }
    keys.forEach((key) => {
      const keyState = this.keyStates.get(key);
      if (keyState && keyState.isDown) {
        if (ENGINE_DEBUG_MODE) {
          console.log(`Key ${key} was held for ${performance.now() - keyState.startTime} ms`);
        }
        keyState.isDown = false;
        keyState.startTime = 0;
      }
    });
  }

  private handleMouseDown(event: MouseEvent): void {
    this.mouseButtonStates.set(event.button, {
      isDown: true,
      startTime: performance.now(),
    });
  }

  private handlePointerDown(event: PointerEvent): void {
    this.mousePosition = { x: event.clientX, y: event.clientY };
    this.pointerStates.set(event.pointerId, {
      button: event.button,
      startTime: performance.now(),
    });
  }

  private handlePointerUp(event: PointerEvent): void {
    const pointerState = this.pointerStates.get(event.pointerId);
    if (pointerState) {
      if (ENGINE_DEBUG_MODE) {
        console.log(
          `Pointer ${event.pointerId} (button ${pointerState.button}) was held for ${performance.now() - pointerState.startTime} ms`,
        );
      }
      this.pointerStates.delete(event.pointerId);
    }
  }

  /**
   * True while any pointer (mouse, pen or touch) is down with the given button (0 = primary/touch)
   */
  public isPointerDown(ind?: number): boolean {
    const button = ind || 0;
    for (const state of this.pointerStates.values()) {
      if (state.button === button) return true;
    }
    return false;
  }

  private handleMouseUp(event: MouseEvent): void {
    const buttonState = this.mouseButtonStates.get(event.button);
    if (buttonState && buttonState.isDown) {
      if (ENGINE_DEBUG_MODE) {
        console.log(`Mouse button ${event.button} was held for ${performance.now() - buttonState.startTime} ms`);
      }
      this.mouseButtonStates.set(event.button, { isDown: false, startTime: 0 });
    }
  }

  private handlePointerMove(event: PointerEvent): void {
    this.mousePosition = { x: event.clientX, y: event.clientY };
  }

  /**
   * @param key The KeyboardEvent.key value, any case (e.g. "a", "ArrowLeft", " ")
   */
  public isKeyDown(key: string): boolean {
    return this.keyStates.get(key.toLowerCase())?.isDown || false;
  }

  public isMouseButtonPressed(button: number): boolean {
    return this.mouseButtonStates.get(button)?.isDown || false;
  }

  /**
   * Last pointer position (mouse, pen or touch) in window/client coordinates, not stage coordinates
   */
  public getMousePosition(): { x: number; y: number } {
    return this.mousePosition;
  }
}

export default InputManager;
