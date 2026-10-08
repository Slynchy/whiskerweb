/**
 * Limits `value` to the range [min, max] (Unity's `Mathf.Clamp`).
 * If min > max the range is empty: values below `min` give `min`, every other value gives `max`.
 * NaN is returned unchanged.
 */
export function mathClamp(value: number, min: number, max: number): number
{
    if (value < min)
        value = min;
    else if (value > max)
        value = max;
    return value;
}
