// Loops the value t, so that it is never larger than length and never smaller than 0.
import { mathClamp } from "./mathClamp";

export function mathRepeat(t: number, length: number): number
{
    return (
        mathClamp(t - Math.floor(t / length) * length, 0.0, length
    ));
}
