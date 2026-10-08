import { System } from "./System";
import { Component } from "../Component";
import { ENGINE_DEBUG_MODE } from "../Constants/Constants";
import { ActivityViaViewportComponent } from "../Components/ActivityViaViewportComponent";
import { Bounds, Matrix, Rectangle } from "pixi.js";

// scratch objects reused by every viewport check
const tempBounds = new Bounds();
const tempMatrix = new Matrix();

export class ActivityViaViewportSystem extends System {


    constructor() {
        super();
    }

    /**
     * The check is driven by the PIXI ticker rather than onStep: GameObject.onStep skips
     * every component of an inactive object, so an object deactivated for being off-screen
     * would never be checked again (and never reactivated).
     */
    public static onAwake(_component: ActivityViaViewportComponent): void {
        const callback = () => ActivityViaViewportSystem.checkViewport(_component);
        _component["_tickerCallback"] = callback;
        ENGINE.getTicker().add(callback);
    }

    private static checkViewport(_component: ActivityViaViewportComponent): void {
        if (!_component.parent || _component.parent.destroyed) {
            ActivityViaViewportSystem.removeTickerCallback(_component);
            return;
        }
        _component["_frameCounter"]++;
        if(_component["_frameCounter"] >= _component["_frameInterval"]) {
            _component["_frameCounter"] = 0;
            _component.parent.visible  = _component.parent.isActive(
                (
                    _component["_viewportRef"]
                ).intersects(
                    ActivityViaViewportSystem.getParentBounds(_component)
                ),
                _component["_recursive"]
            );
        }
    }

    /**
     * Global bounds of the parent. getBounds() returns an empty rect for an invisible container,
     * so once this system hid an object it could never intersect the viewport again; the local
     * bounds ignore the container's own visibility.
     */
    private static getParentBounds(_component: ActivityViaViewportComponent): Rectangle {
        const parent = _component.parent;
        tempBounds.clear();
        tempBounds.addBounds(parent.getLocalBounds(), parent.getGlobalTransform(tempMatrix));
        return tempBounds.rectangle;
    }

    private static removeTickerCallback(_component: ActivityViaViewportComponent): void {
        if (_component["_tickerCallback"]) {
            ENGINE.getTicker().remove(_component["_tickerCallback"]);
            _component["_tickerCallback"] = null;
        }
    }

    public static onStep(_dt: number, _component: ActivityViaViewportComponent): void {
        // see onAwake; the check runs on the ticker
    }

    public static onDestroy(_component: ActivityViaViewportComponent): void {
        if (ENGINE_DEBUG_MODE) {
            console.log("Calling onDestroy for " + (_component.constructor as typeof Component).id);
        }
        ActivityViaViewportSystem.removeTickerCallback(_component);
    }

    public static onEnable(_component: ActivityViaViewportComponent): void {
    }

    public static onDisable(_component: ActivityViaViewportComponent): void {
    }

}
