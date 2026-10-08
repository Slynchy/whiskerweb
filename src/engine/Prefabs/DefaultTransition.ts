import { State } from "../State";
import { Engine } from "../Engine";

export class DefaultTransition extends State {
    onAwake(_engine: Engine, _params?: unknown): void {
    }

    onDestroy(_engine: Engine): void {
        super.onDestroy(_engine);
    }

    onStep(_engine: Engine): void {
        super.onStep(_engine);
    }

    preload(_engine: Engine): Promise<void> {
        return Promise.resolve(undefined);
    }

    onResize(_engine: Engine, _params?: unknown): void {
    }

}
