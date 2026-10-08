import { System } from "./System";
import { Component } from "../Component";
import { Engine } from "../Engine";
import { SpriteComponent } from "../Components/SpriteComponent";

export class SpriteSystem extends System {
    protected static _engineRef: Engine;

    protected static get engine(): Engine {
        return SpriteSystem._engineRef;
    }

    protected static set engine(engine) {
        SpriteSystem._engineRef = engine;
    }

    public static destroy(_component: Component): void {
        super.destroy(_component);
    }

    public static onAwake(_component: Component): void {
    }

    public static onStep(_dt: number, _component: Component): void {
    }

    public static onDestroy(_component: SpriteComponent): void {
        // onDetach has already taken the sprite off the GameObject, so it would otherwise leak.
        // The texture is shared through the asset cache, so leave it alone.
        const sprite = _component.getSpriteObj();
        if (sprite && !sprite.destroyed) {
            sprite.destroy();
        }
    }

    public static onEnable(_component: Component)  : void {}
    public static onDisable(_component: Component) : void {}
}
