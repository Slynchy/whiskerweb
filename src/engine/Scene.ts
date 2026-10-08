import { Engine } from "./Engine";
import { GameObject } from "./GameObject";
import { HelperFunctions } from "./HelperFunctions";
import { Container, Container as DisplayObject } from "pixi.js";

export class Scene {
    public stage: Container;

    constructor() {}

    public addObject(obj: GameObject | DisplayObject): void {
        if (!this.stage || this.stage.destroyed) this.createStage();
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
        this.removeAllObjects(true);
    }

    /**
     * Removes every object from the scene
     * @param _destroy Also destroy them (and their children)
     */
    public removeAllObjects(_destroy?: boolean): void {
        const removed = this.stage.removeChildren();
        if (_destroy) {
            removed.forEach((e) => e.destroy({ children: true }));
        }
    }

    /**
     * Called when adding the scene to the engine.
     * A scene whose stage was destroyed (its state was left earlier) gets a fresh one.
     */
    public onApply(_engine: Engine): void {
        if (!this.stage || this.stage.destroyed) this.createStage();
        _engine["getStage"]().addChild(this.stage);
    }

    /**
     * Called when removing the scene from the engine
     */
    public onDestroy(_engine: Engine): void {
        this.removeAllObjects();
    }

    public onStep(_engine: Engine): void {
        this.stage.children.forEach((e) => Scene.stepObject(e, _engine.deltaTime));
    }

    /**
     * Calls `onStep(dt)` on the object, if it has one, and then on all of its descendants
     */
    public static stepObject(_obj: GameObject | DisplayObject, _dt: number): void {
        if (!(_obj instanceof Container)) return;
        // @ts-ignore
        if (_obj.onStep) {
            // @ts-ignore
            _obj.onStep(_dt);
        }
        _obj.children.forEach((e) => Scene.stepObject(e, _dt));
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
