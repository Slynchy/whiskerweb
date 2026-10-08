import { IVector2 } from "../Types/IVector2";
import { IVector3 } from "../Types/IVector3";

/**
 * Multiplies `a` component-wise by the vector `b`, or by the scalar `b`
 */
// Yes, the ignores are needed
export function multiplyVector<T extends IVector2 | IVector3>(a: T, b: T | number): T {
    // Checking the type (rather than `b.x || b`) keeps 0 components working
    const isScalar: boolean = typeof b === "number";
    if(Object.hasOwnProperty.call(a, "z")) {
        // vector3
        return {
            // @ts-ignore
            x: a.x * (isScalar ? b : b.x),
            // @ts-ignore
            y: a.y * (isScalar ? b : b.y),
            // @ts-ignore
            z: (a as IVector3).z * (isScalar ? b : (b as IVector3).z),
        } as T;
    } else {
        return {
            // @ts-ignore
            x: a.x * (isScalar ? b : b.x),
            // @ts-ignore
            y: a.y * (isScalar ? b : b.y)
        } as T;
    }
}