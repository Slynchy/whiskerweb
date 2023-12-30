import { Engine } from "./Engine";
import { GameObject } from "./GameObject";
import { HelperFunctions } from "./HelperFunctions";
import { Container, Container as DisplayObject } from "pixi.js";

export class Scene {
    public stage: Container;

    constructor() {}

    public addObject(obj: GameObject | DisplayObject): void {
        if (!this.stage) this.createStage();
        try {
            HelperFunctions.addToStage(this.stage, obj);
        } catch (err) {
            console.error(err);
        }
    }

    /**
     * @deprecated Easier to do this yourself
     * @param obj
     */
    public removeObject(obj: GameObject): void {
        obj.parent?.removeChild(obj);
    }

    public getStageChildren(): unknown[] {
        return this.stage.children;
    }

    public destroyAllObjects(): void {
        this.stage.parent?.removeChild(this.stage);
        this.stage.destroy({
            children: true
        });
        this.stage = new Container();
        this.removeAllObjects();
    }

    public removeAllObjects(_destroy?: boolean): void {
        this.stage.children.forEach((e) => this.stage.removeChild(e));
    }

    /**
     * Called when adding the scene to the engine
     */
    public onApply(_engine: Engine): void {
        if (!this.stage) this.createStage();
        _engine["getStage"]().addChild(this.stage);
    }

    /**
     * Called when removing the scene from the engine
     */
    public onDestroy(_engine: Engine): void {
        this.removeAllObjects();
    }

    public onStep(_engine: Engine): void {
        const update = (e: GameObject | DisplayObject) => {
            if (e instanceof GameObject || e instanceof Container) {
                // @ts-ignore
                if (e.onStep) {
                    // @ts-ignore
                    e.onStep(_engine.deltaTime);
                }
                e.children.forEach((e) => update(e));
            }
        };
        this.stage.children.forEach((e) => update(e));
    }

    public getStage(): Container {
        // hope you know what you're doing.
        return this.stage;
    }

    public render(_engine: Engine): void {
        _engine.getRenderManager().getRenderer().render(this.stage);
    }

    private createStage(): void {
        this.stage = new Container();
    }
}
