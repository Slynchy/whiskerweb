import { System } from "./System";
import { Component } from "../Component";
import { ENGINE_DEBUG_MODE } from "../Constants/Constants";
import { ScaleElementOnClickComponent } from "../Components/ScaleElementOnClickComponent";
import { HelperFunctions } from "../HelperFunctions";
import { Easing } from "@tweenjs/tween.js";

export class ScaleElementOnClickSystem extends System {


    constructor() {
        super();
    }

    public static onAwake(_component: ScaleElementOnClickComponent): void {
        const onPointerDown = () => ScaleElementOnClickSystem.onPointerDown(_component);
        const onPointerUp = () => ScaleElementOnClickSystem.onPointerUp(_component);
        _component["onPointerDownHandler"] = onPointerDown;
        _component["onPointerUpHandler"] = onPointerUp;
        _component.parent.eventMode = "static";
        _component.parent.on("pointerdown", onPointerDown);
        _component.parent.on("pointerup", onPointerUp);
        _component.parent.on("pointerout", onPointerUp);
    }

    /**
     * False once the component has been destroyed (its handlers are cleared in onDestroy)
     * or its parent GameObject has.
     */
    private static isAlive(_component: ScaleElementOnClickComponent): boolean {
        return Boolean(
            _component &&
            _component["onPointerUpHandler"] &&
            _component.parent &&
            !_component.parent.destroyed
        );
    }

    private static onPointerDown(_component: ScaleElementOnClickComponent): void {
        if(_component["startPos"] || _component["startSize"] || _component["scaleAnim"]) return;
        _component["startPos"] = {x: _component.parent.x, y: _component.parent.y};
        _component["startSize"] = {x: _component.parent.width, y: _component.parent.height};
        _component["scaleAnim"] = HelperFunctions.TWEENVec2AsPromise(
            _component.parent.scale,
            {x: _component.scaleFactor, y: _component.scaleFactor},
            Easing.Quadratic.Out,
            180,
            () => {
                if(!ScaleElementOnClickSystem.isAlive(_component) || !_component["startPos"]) return false;
                _component.parent.position.set(
                    _component["startPos"].x + ((_component["startSize"].x - (_component["startSize"].x * _component.parent.scale.x)) * 0.5),
                    _component["startPos"].y + ((_component["startSize"].y - (_component["startSize"].y * _component.parent.scale.y)) * 0.5)
                );
                return true;
            }
        );
        _component["scaleAnim"].promise.then(() => _component["scaleAnim"] = null);
    }

    private static async onPointerUp(_component: ScaleElementOnClickComponent): Promise<void> {
        if (_component["scaleAnim"]) await _component["scaleAnim"].promise;
        // the component or its GameObject may have been destroyed while we waited
        if (!ScaleElementOnClickSystem.isAlive(_component)) return;
        // pointerup and pointerout can both be waiting here; only the first starts the release tween
        if (_component["scaleAnim"]) return;
        if(!_component["startPos"] || !_component["startSize"]) return;
        _component["scaleAnim"] = HelperFunctions.TWEENVec2AsPromise(
            _component.parent.scale,
            {x: 1, y: 1},
            Easing.Quadratic.Out,
            180,
            () => {
                if(!ScaleElementOnClickSystem.isAlive(_component) || !_component["startPos"]) return false;
                _component.parent.position.set(
                    _component["startPos"].x + ((_component["startSize"].x - (_component["startSize"].x * _component.parent.scale.x)) * 0.5),
                    _component["startPos"].y + ((_component["startSize"].y - (_component["startSize"].y * _component.parent.scale.y)) * 0.5)
                );
                return true;
            }
        );
        _component["scaleAnim"].promise.then(() => {
            _component["scaleAnim"] = null;
            _component["startPos"] = null;
            _component["startSize"] = null;
        });
    }

    public static onStep(_dt: number, _component: ScaleElementOnClickComponent): void {
    }

    public static onDestroy(_component: ScaleElementOnClickComponent): void {
        if (ENGINE_DEBUG_MODE) {
            console.log("Calling onDestroy for " + (_component.constructor as typeof Component).id);
        }
        const parent = _component.parent;
        const onPointerDown = _component["onPointerDownHandler"];
        const onPointerUp = _component["onPointerUpHandler"];
        _component["onPointerDownHandler"] = null;
        _component["onPointerUpHandler"] = null;

        // off() without a function removes every listener for the event, so only pass real handlers
        if (parent && onPointerDown) parent.off("pointerdown", onPointerDown);
        if (parent && onPointerUp) {
            parent.off("pointerup", onPointerUp);
            parent.off("pointerout", onPointerUp);
        }

        // cancel() leaves the tween where it is, so put a mid-press element back to its resting state
        _component.cancel();
        if (parent && !parent.destroyed && _component["startPos"]) {
            parent.scale.set(1, 1);
            parent.position.set(_component["startPos"].x, _component["startPos"].y);
        }
        _component["startPos"] = null;
        _component["startSize"] = null;
    }

    public static onEnable(_component: ScaleElementOnClickComponent): void {
    }

    public static onDisable(_component: ScaleElementOnClickComponent): void {
    }

}
