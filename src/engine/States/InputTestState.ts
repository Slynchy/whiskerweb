import {State} from "../State";
import {Engine} from "../Engine";
import {Container, Graphics, Sprite, Texture} from "pixi.js";
import {buttonify} from "../HelperFunctions/buttonify";
import {IVector2} from "../Types/IVector2";
import {HelperFunctions} from "../HelperFunctions";
import {Easing} from "@tweenjs/tween.js";

export class InputTestState extends State {
    onAwake(_engine: Engine, _params?: unknown): void {
        const texture =
            _engine.getPIXIResource("TestAsset") as Texture;
        const dimensions: IVector2 = {
            x: 512,
            y: 512
        };

        const container = new Container();
        container.position.set(
            ENGINE.getRenderManager().width * 0.5,
            ENGINE.getRenderManager().height * 0.5
        );
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
                HelperFunctions.TWEENAsPromise(
                    testSpr,
                    "rotation",
                    Math.PI * 2,
                    Easing.Linear.None,
                ).promise.then(() => {
                    testSpr.rotation = 0;
                });
                console.log(ev);
            }
        });

        _engine.getTicker().start();
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