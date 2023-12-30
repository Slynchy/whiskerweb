import { IVector2 } from "../Types/IVector2";
import { IVector3 } from "../Types/IVector3";

// Yes, the ignores are needed
export function addVector<T extends IVector2 | IVector3>(a: T, b: T | number): T {
    if(Object.hasOwnProperty.call(a, "z")) {
        // vector3
        return {
            // @ts-ignore
            x: a.x + (typeof b.x === "undefined" ? b : b.x),
            // @ts-ignore
            y: a.y + (typeof b.y === "undefined" ? b : b.y),
            // @ts-ignore
            z: (a as IVector3).z +
                (
                    // @ts-ignore
                    (typeof b.z === "undefined" ? b : b.z)
                ),
        } as T;
    } else {
        return {
            // @ts-ignore
            x: a.x + (typeof b.x === "undefined" ? b : b.x),
            // @ts-ignore
            y: a.y + (typeof b.y === "undefined" ? b : b.y)
        } as T;
    }
}
