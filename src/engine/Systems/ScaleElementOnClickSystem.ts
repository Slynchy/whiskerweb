import { System } from "./System";
import { Component } from "../Component";
import { ENGINE_DEBUG_MODE } from "../Constants/Constants";
import { ScaleElementOnClickComponent } from "../Components/ScaleElementOnClickComponent";
import { IVector2 } from "../Types/IVector2";
import { HelperFunctions } from "../HelperFunctions";
import { Easing } from "@tweenjs/tween.js";

export class ScaleElementOnClickSystem extends System {


    constructor() {
        super();
    }

    public static onAwake(_component: ScaleElementOnClickComponent): void {
        // let startPos: IVector2 = null;
        // let startSize: IVector2 = null;
        // let scaleAnimPromise: Promise<void>;
        _component.parent.interactive = true;
        _component.parent.on("pointerdown", () => ScaleElementOnClickSystem.onPointerDown(_component));
        _component.parent.on("pointerup", () => ScaleElementOnClickSystem.onPointerUp(_component));
        _component.parent.on("pointerout", () => ScaleElementOnClickSystem.onPointerUp(_component));
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
                // if(!_component.parent.transform) return false;
                if(!_component || !_component.parent || !_component["startPos"]) return false;
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
        if(!_component["startPos"] || !_component["startSize"]) return;
        _component["scaleAnim"] = HelperFunctions.TWEENVec2AsPromise(
            _component.parent.scale,
            {x: 1, y: 1},
            Easing.Quadratic.Out,
            180,
            () => {
                // if(!_component.parent.transform) return false;
                if(!_component || !_component.parent || !_component["startPos"]) return false;
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
    }

    public static onEnable(_component: ScaleElementOnClickComponent): void {
    }

    public static onDisable(_component: ScaleElementOnClickComponent): void {
    }

}
