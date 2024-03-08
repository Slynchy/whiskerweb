import { Component, HelperFunctions, System } from "../../index";
import { ENGINE_DEBUG_MODE } from "../Constants/Constants";
import { RandomMovementComponent } from "../Components/RandomMovementComponent";
import { randomPointInsideUnitCircle } from "../HelperFunctions/randomPointInsideUnitCircle";
import { multiplyVector } from "../HelperFunctions/multiplyVector";
import { addVector } from "../HelperFunctions/addVector";
import { smoothDampVec } from "../HelperFunctions/smoothDampVec";

export class RandomMovementSystem extends System {
    public static destroy(_component: Component): void {
        if (ENGINE_DEBUG_MODE) {
            console.log("Calling destroy for " + (_component.constructor as typeof Component).id);
        }
    }

    public static onAwake(_component: RandomMovementComponent): void {
        _component._smoothTime = 1.0 / (_component.speed);
    }


    private static setRandomDestination(_component: RandomMovementComponent): void
    {
        _component._dest =
            addVector(
                _component._initialPos,
                (multiplyVector(randomPointInsideUnitCircle(), _component.distance * 55))
            );
    }

    public static onStep(_dt: number, _component: RandomMovementComponent): void {
        if(!_component.parent.isActive()) return;
        if(_component._newDestCountdown <= 0) {
            RandomMovementSystem.setRandomDestination(_component);
            _component._newDestCountdown =
                HelperFunctions.randomRange(_component.minChangeDelay, _component.maxChangeDelay);
        }

        const test = smoothDampVec(
            {
                x: _component.parent.position.x,
                y: _component.parent.position.y
            }, {
                x: _component._dest.x,
                y: _component._dest.y,
            }, _component._velocity, _component._smoothTime, _component.maxSpeed * 10
        );
        _component.parent.position.set(test.x, test.y);

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
