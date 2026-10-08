import {State} from "../State";
import {Engine} from "../Engine";
import {Container, Graphics, Sprite, Texture} from "pixi.js";
import {buttonify} from "../HelperFunctions/buttonify";
import {IVector2} from "../Types/IVector2";
import {HelperFunctions, ITweenAnimationReturnValue} from "../HelperFunctions";
import {Easing} from "@tweenjs/tween.js";

export class InputTestState extends State {
    private _container: Container = null;
    private _spinAnim: ITweenAnimationReturnValue = null;

    onAwake(_engine: Engine, _params?: unknown): void {
        const texture =
            _engine.getPIXIResource("TestAsset") as Texture;
        const dimensions: IVector2 = {
            x: 512,
            y: 512
        };

        const container = this._container = new Container();
        this.scene.addObject(container);

        const bg =
            new Graphics()
                .rect(
                    -(dimensions.x * 0.5), -(dimensions.y * 0.5),
                    dimensions.x, dimensions.y
                )
                .fill(0xfafafa);
        container.addChild(bg);

        const testSpr = new Sprite();
        testSpr.anchor.set(0.5, 0.5);
        testSpr.texture = texture;
        testSpr.width = dimensions.x;
        testSpr.height = dimensions.y;
        // testSpr.rotation;
        container.addChild(testSpr);

        buttonify(testSpr, {
            onFire: (ev) => {
                // stop any spin in progress so repeated clicks don't stack tweens
                if (this._spinAnim) this._spinAnim.cancel();
                const spin = this._spinAnim = HelperFunctions.TWEENAsPromise(
                    testSpr,
                    "rotation",
                    testSpr.rotation + Math.PI * 2,
                    Easing.Linear.None,
                );
                spin.promise.then(() => {
                    if (this._spinAnim !== spin) return; // superseded by a later click
                    this._spinAnim = null;
                    testSpr.rotation %= Math.PI * 2;
                });
                console.log(ev);
            }
        });

        this.onResize(_engine);
        _engine.getTicker().start();
    }

    onStep(_engine: Engine): void {
        super.onStep(_engine);
    }

    preload(_engine: Engine): Promise<void> {
        return Promise.resolve(undefined);
    }

    onResize(_engine: Engine, _params?: unknown): void {
        if (!this._container) return;
        this._container.position.set(
            _engine.getRenderManager().width * 0.5,
            _engine.getRenderManager().height * 0.5
        );
    }

    onDestroy(_engine: Engine): void {
        // the sprite is destroyed with the stage; don't leave a tween writing to it
        if (this._spinAnim) this._spinAnim.cancel();
        this._spinAnim = null;
        this._container = null;
        super.onDestroy(_engine);
    }

}