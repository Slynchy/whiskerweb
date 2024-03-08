import { Component, HelperFunctions, System } from "../../index";
import { ENGINE_DEBUG_MODE } from "../Constants/Constants";
import { RandomRotationComponent } from "../Components/RandomRotationComponent";
import { smoothDampVec } from "../HelperFunctions/smoothDampVec";
import { smoothDampAngle } from "../HelperFunctions/smoothDampAngle";

export class RandomRotationSystem extends System {

    public static destroy(_component: Component): void {
        if (ENGINE_DEBUG_MODE) {
            console.log("Calling destroy for " + (_component.constructor as typeof Component).id);
        }
    }

    private static setRandomDestination(_component: RandomRotationComponent)
    {
        const oldAngle = _component._destAngle;
        _component._destAngle =
            _component._initialAngle + HelperFunctions.randomRange(0, _component.maxAngleDelta) * -1;
    }

    public static onAwake(_component: RandomRotationComponent): void {
        _component._smoothTime = 1.0 / (_component.speed);
    }

    public static onStep(_dt: number, _component: RandomRotationComponent): void {
        if(!_component.parent.isActive()) return;
        if(_component._newDestCountdown <= 0) {
            RandomRotationSystem.setRandomDestination(_component);
            _component._newDestCountdown =
                HelperFunctions.randomRange(_component.minChangeDelay, _component.maxChangeDelay);
        }

        _component.parent.rotation =
            HelperFunctions.deg2rad(smoothDampAngle(
                HelperFunctions.rad2deg(_component.parent.rotation),
                _component._destAngle,
                (vel?: number) => {
                    if(typeof vel !== "undefined") {
                        _component._velocity = vel;
                    } else {
                        return _component._velocity;
                    }
                },
                _component._smoothTime,
                _component.maxSpeed * 360
            ));

        _component._newDestCountdown -= ENGINE.getTicker().deltaMS / 1000;
    }

    public static onDestroy(_component: Component): void {
        if (ENGINE_DEBUG_MODE) {
            console.log("Calling onDestroy for " + (_component.constructor as typeof Component).id);
        }
    }

    public static onEnable(_component: Component): void {
    }

    public static onDisable(_component: Component): void {
    }
}
