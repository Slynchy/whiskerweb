import { IVector2 } from "../Types/IVector2";
import { IVector3 } from "../Types/IVector3";

// Yes, the ignores are needed
export function multiplyVector<T extends IVector2 | IVector3>(a: T, b: T | number): T {
    if(Object.hasOwnProperty.call(a, "z")) {
        // vector3
        return {
            // @ts-ignore
            x: a.x * (b.x || b),
            // @ts-ignore
            y: a.y * (b.y || b),
            // @ts-ignore
            z: (a as IVector3).z * ((b as IVector3).z || b),
        } as T;
    } else {
        return {
            // @ts-ignore
            x: a.x * (b.x || b),
            // @ts-ignore
            y: a.y * (b.y || b)
        } as T;
    }
}
