class InputManager {
  private keyStates: Map<string, { isDown: boolean; startTime: number }> =
    new Map();
  private mouseButtonStates: Map<
    number,
    { isDown: boolean; startTime: number }
  > = new Map();
  private pointerStates: Map<number, { isDown: boolean; startTime: number }> =
    new Map();
  private mousePosition: { x: number; y: number } = { x: 0, y: 0 };

  private _initialized: boolean = false;
  private _killFunction: () => void;

  constructor() {}

  public get initialized(): boolean {
    return this._initialized;
  }

  public initialize(): Promise<void> {
    const handleKeyDown = this.handleKeyDown.bind(this);
    const handleKeyUp = this.handleKeyUp.bind(this);
    const handleMouseDown = this.handleMouseDown.bind(this);
    const handleMouseUp = this.handleMouseUp.bind(this);
    const handleMouseMove = this.handleMouseMove.bind(this);
    const handlePointerDown = this.handlePointerDown.bind(this);
    const handlePointerUp = this.handlePointerUp.bind(this);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    this._killFunction = () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
    };
    return Promise.resolve();
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();

    if (!this.keyStates.has(key)) {
      this.keyStates.set(key, { isDown: true, startTime: performance.now() });
    } else {
      const state = this.keyStates.get(key);
      state.isDown = true;
      state.startTime = performance.now();
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    const keyState = this.keyStates.get(key);
    if (keyState) {
      const duration = performance.now() - keyState.startTime;
      console.log(`Key ${key} was held for ${duration} ms`);
      this.keyStates.set(key, { isDown: false, startTime: 0 });
    }
  }

  private handleMouseDown(event: MouseEvent): void {
    this.mouseButtonStates.set(event.button, {
      isDown: true,
      startTime: performance.now(),
    });
  }

  private handlePointerDown(event: PointerEvent): void {
    this.pointerStates.set(event.button, {
      isDown: true,
      startTime: performance.now(),
    });
  }

  private handlePointerUp(event: PointerEvent): void {
    const buttonState = this.pointerStates.get(event.button);
    if (buttonState && buttonState.isDown) {
      const duration = performance.now() - buttonState.startTime;
      console.log(`Pointer button ${event.button} was held for ${duration} ms`);
      this.pointerStates.set(event.button, { isDown: false, startTime: 0 });
    }
  }

  public isPointerDown(ind?: number): boolean {
    return this.pointerStates.get(ind || 0)?.isDown || false;
  }

  private handleMouseUp(event: MouseEvent): void {
    const buttonState = this.mouseButtonStates.get(event.button);
    if (buttonState && buttonState.isDown) {
      const duration = performance.now() - buttonState.startTime;
      console.log(`Mouse button ${event.button} was held for ${duration} ms`);
      this.mouseButtonStates.set(event.button, { isDown: false, startTime: 0 });
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    this.mousePosition = { x: event.clientX, y: event.clientY };
  }

  public isKeyDown(key: string): boolean {
    return this.keyStates.get(key)?.isDown || false;
  }

  public isMouseButtonPressed(button: number): boolean {
    return this.mouseButtonStates.get(button)?.isDown || false;
  }

  public getMousePosition(): { x: number; y: number } {
    return this.mousePosition;
  }
}

export default InputManager;
