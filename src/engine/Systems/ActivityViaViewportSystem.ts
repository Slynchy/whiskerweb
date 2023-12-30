import { System } from "./System";
import { Component } from "../Component";
import { ENGINE_DEBUG_MODE } from "../Constants/Constants";
import { ActivityViaViewportComponent } from "../Components/ActivityViaViewportComponent";

export class ActivityViaViewportSystem extends System {


    constructor() {
        super();
    }

    public static onAwake(_component: ActivityViaViewportComponent): void {
    }

    public static onStep(_dt: number, _component: ActivityViaViewportComponent): void {
        _component["_frameCounter"]++;
        if(_component["_frameCounter"] >= _component["_frameInterval"]) {
            _component["_frameCounter"] = 0;
            _component.parent.visible  = _component.parent.isActive(
                (
                    _component["_viewportRef"]
                ).intersects(
                    _component.parent.getBounds()
                ),
                _component["_recursive"]
            );
        }
    }

    public static onDestroy(_component: ActivityViaViewportComponent): void {
        if (ENGINE_DEBUG_MODE) {
            console.log("Calling onDestroy for " + (_component.constructor as typeof Component).id);
        }
    }

    public static onEnable(_component: ActivityViaViewportComponent): void {
    }

    public static onDisable(_component: ActivityViaViewportComponent): void {
    }

}
