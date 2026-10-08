import { State } from "./State";
import { Engine } from "./Engine";
import { ENGINE_DEBUG_MODE } from "./Constants/Constants";

export class StateManager {
  private engine: Engine;
  private currentState: State;

  constructor(_engine: Engine) {
    this.engine = _engine;
  }

  public getState(): State {
    return this.currentState;
  }

  public hasState(_stateType?: typeof State): boolean {
    if (_stateType) {
      return Boolean(this.currentState instanceof _stateType);
    } else {
      return Boolean(this.currentState);
    }
  }

  public setState(_state: State, _params?: unknown): Promise<void> {
    if (this.currentState) {
      const oldState = this.currentState;
      this.currentState = undefined;
      oldState.onDestroy(this.engine);
      oldState.scene.getStage()?.destroy({ children: true });
    }
    this.currentState = _state;
    _state.getScene().onApply(this.engine);
    return _state.preload(this.engine).then(() => {
      // Another changeState happened while this state was preloading
      if (this.currentState !== _state) return;
      if (ENGINE_DEBUG_MODE) console.log("Preload complete");
      _state.onAwake(this.engine, _params);
    });
  }

  public onStep(): void {
    this.currentState?.onStep(this.engine);
  }
}
