import {State} from "../State";
import {Engine} from "../Engine";
import {Component} from "../Component";
import {GameObject} from "../GameObject";
import {System} from "../Systems/System";
import {ENGINE_DEBUG_MODE} from "../Constants/Constants";
import {AnimationSystem} from "../Systems/AnimationSystem";
import {Graphics} from "pixi.js";

class TestSystem extends System {
    public static onAwake(_component: Component): void {
    }

    public static onStep(_dt: number, _component: Component): void {
        _component.parent.position.set(
            Math.random() * ENGINE.getRenderManager().width,
            Math.random() * ENGINE.getRenderManager().height,
        );
    }

    public static onDestroy(_component: Component): void {
        if (ENGINE_DEBUG_MODE) {
            console.log("Calling onDestroy for " + (_component.constructor as typeof Component).id);
        }
    }
}

class TestComponent extends Component {

    public static readonly id: string = "TestComponent";
    protected static readonly _system: typeof TestSystem = TestSystem;
    public a: number = 0;

    onAttach(): void {}
    onComponentAttached(_componentId: string, _component: Component): void {}
    onDetach(): void {}
}

export class StressTestState extends State {
    constructor() {
        super();
    }

    onAwake(_engine: Engine, _params?: unknown): void {
        for(let i = 0; i < 20; i++) {
            const gameObject = new GameObject();
            gameObject.addComponent(new TestComponent());
            const graphic =
                new Graphics()
                    .circle(0, 0, 1)
                    .fill(0xff0000);
            // graphic.beginFill(0xff0000);
            // graphic.drawCircle(0, 0, 1);
            // graphic.endFill();
            gameObject.addChild(graphic);
            this.scene.addObject(gameObject);
        }

        _engine.getTicker().start();
    }

    preload(_engine: Engine): Promise<void> {
        return Promise.resolve(undefined);
    }

    onResize(_engine: Engine, _params?: unknown): void {
    }


}