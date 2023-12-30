import { Component } from "../Component";
import { ENGINE_DEBUG_MODE } from "../Constants/Constants";

export abstract class System {
    constructor() {
        throw new Error("No instantiating systems!");
    }

    public static destroy(_component: Component): void {
        if (ENGINE_DEBUG_MODE) {
            console.log("Calling destroy for " + (_component.constructor as typeof Component).id);
        }
        this.onDestroy(_component);
    }

    public static onAwake(_component: Component): void {
    }

    public static onStep(_dt: number, _component: Component): void {
    }

    public static onDestroy(_component: Component): void {
        if (ENGINE_DEBUG_MODE) {
            console.log("Calling onDestroy for " + (_component.constructor as typeof Component).id);
        }
        _component.onDestroy();
    }

    public static onEnable(_component: Component): void {
    }

    public static onDisable(_component: Component): void {
    }

}
