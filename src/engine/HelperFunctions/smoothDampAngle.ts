import { deltaAngle } from "./deltaAngle";
import { smoothDampNumber } from "./smoothDampNumber";

export function smoothDampAngle(
    current: number, // float current,
    target: number, // float target,
    getSetCurrentVelocity: (vel?: number) => number, // ref float currentVelocity,
    smoothTime: number, // float smoothTime,
    maxSpeed: number = Number.MAX_SAFE_INTEGER, // [uei.DefaultValue("Mathf.Infinity")]  float maxSpeed,
    deltaTime: number = (ENGINE.getTicker().deltaMS / 1000), // [uei.DefaultValue("Time.deltaTime")]  float deltaTime
): number {
    target = current + deltaAngle(current, target);
    return smoothDampNumber(
        current, target,
        getSetCurrentVelocity,
        smoothTime, maxSpeed, deltaTime
    );
}
