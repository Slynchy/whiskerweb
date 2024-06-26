import { State } from "./State";
import { Engine } from "./Engine";

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
      this.currentState.onDestroy(this.engine);
      this.currentState.scene.getStage().destroy({ children: true });
      this.currentState = undefined;
    }
    this.currentState = _state;
    this.currentState.getScene().onApply(this.engine);
    return this.currentState
      .preload(this.engine)
      .then(() => console.log("Preload complete"))
      .then(() => this.currentState.onAwake(this.engine, _params || undefined));
  }

  public onStep(): void {
    this.currentState?.onStep(this.engine);
  }
}
