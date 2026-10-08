import { Easing } from "@tweenjs/tween.js";

/**
 * Names of the tween.js `Easing` groups. Every group has `In`, `Out` and `InOut`;
 * only `Linear` also has `None` (all four are the same linear function).
 */
export enum TWEENFunctions {
    Linear = "Linear",
    Quadratic = "Quadratic",
    Cubic = "Cubic",
    Quartic = "Quartic",
    Quintic = "Quintic",
    Sinusoidal = "Sinusoidal",
    Exponential = "Exponential",
    Circular = "Circular",
    Elastic = "Elastic",
    Back = "Back",
    Bounce = "Bounce"
}

export enum TWEENDirection {
    In = "In",
    Out = "Out",
    InOut = "InOut",
    /** Only valid with `TWEENFunctions.Linear` */
    None = "None",
}

export type TEasingFunction = (amount: number) => number;

/**
 * Returns the tween.js easing function for a `TWEENFunctions` / `TWEENDirection` pair,
 * e.g. `getEasingFunction(TWEENFunctions.Back, TWEENDirection.Out)` is `Easing.Back.Out`.
 * A pair tween.js doesn't have (such as `Quadratic` + `None`) logs a warning and gives linear easing.
 */
export function getEasingFunction(_function: TWEENFunctions, _direction: TWEENDirection): TEasingFunction {
    const group = (Easing as unknown as Record<string, Record<string, TEasingFunction> | undefined>)[_function];
    const easing = group ? group[_direction] : undefined;
    if (typeof easing !== "function") {
        console.warn(`tween.js has no easing ${_function}.${_direction}; using Linear`);
        return Easing.Linear.None;
    }
    return easing;
}
