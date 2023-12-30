import { mathClamp } from "./mathClamp";

export function smoothDampNumber(
    current: number,// float current,
    target: number,// float target,
    getSetCurrentVelocity: (vel?: number) => number, // ref float currentVelocity,
    smoothTime: number, // float smoothTime,
    maxSpeed: number, // [uei.DefaultValue("Mathf.Infinity")]  float maxSpeed,
    deltaTime: number = (ENGINE.getTicker().deltaMS / 1000), // [uei.DefaultValue("Time.deltaTime")]  float deltaTime)
): number {
    // // Based on Game Programming Gems 4 Chapter 1.10
    smoothTime = Math.max(0.0001, smoothTime);
    const omega = 2 / smoothTime;
    //
    const x: number = omega * deltaTime;
    const exp: number = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    let change: number = current - target;
    const originalTo: number = target;

    // Clamp maximum speed
    const maxChange = maxSpeed * smoothTime;
    change = mathClamp(change, -maxChange, maxChange);
    target = current - change;

    const temp = (getSetCurrentVelocity() + omega * change) * deltaTime;
    getSetCurrentVelocity((getSetCurrentVelocity() - omega * temp) * exp);
    let output = target + (change + temp) * exp;

    // Prevent overshooting
    if (originalTo - current > 0.0 == output > originalTo)
    {
        output = originalTo;
        getSetCurrentVelocity((output - originalTo) / deltaTime);
    }

    return output;
}
