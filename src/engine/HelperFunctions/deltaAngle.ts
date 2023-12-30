/**
 * "Calculates the shortest difference between two given angles"
 */
import { mathRepeat } from "./mathRepeat";

export function deltaAngle(current: number, target: number): number
{
    let delta: number = mathRepeat((target - current), 360.0);
    if (delta > 180.0)
    delta -= 360.0;
    return delta;
}
