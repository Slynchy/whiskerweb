import { IVector2 } from "../Types/IVector2";
import { IVector3 } from "../Types/IVector3";

export function smoothDampVec<T extends IVector3 | IVector2>(
    current: T,
    target: T,
    currentVelocity: T,
    smoothTime: number,
    maxSpeed: number = Number.MAX_SAFE_INTEGER
): T {
    // @ts-ignore
    const hasZ: boolean = typeof current.z === "number";
    // "deltaTime: The interval in seconds from the last frame to the current one"
    const deltaTime = ENGINE.getTicker().deltaMS / 1000;
    let output_x = 0.0;
    let output_y = 0.0;
    let output_z = 0.0;

    // Based on Game Programming Gems 4 Chapter 1.10
    smoothTime = Math.max(0.0001, smoothTime);
    const omega = 2.0 / smoothTime;
    const x = omega * deltaTime;
    const exp = 1.0 / (1.0 + x + 0.48 * x * x + 0.235 * x * x * x);
    let change_x = current.x - target.x;
    let change_y = current.y - target.y;
    let change_z = 0;
    if(hasZ) {
        // @ts-ignore
        change_z = current.z - target.z;
    }
    const originalTo = {
        x: target.x,
        y: target.y,
        // @ts-ignore
        z: target.z,
    };
    const maxChange = maxSpeed * smoothTime;
    const maxChangeSq = maxChange * maxChange;
    const sqrmag = change_x * change_x + change_y * change_y + change_z * change_z;
    if (sqrmag > maxChangeSq)
    {
        const mag = Math.sqrt(sqrmag);
        change_x = change_x / mag * maxChange;
        change_y = change_y / mag * maxChange;
        change_z = change_z / mag * maxChange;
    }
    target.x = current.x - change_x;
    target.y = current.y - change_y;
    if(hasZ) {
        // @ts-ignore
        target.z = current.z - change_z;
    }

    const temp_x = (currentVelocity.x + omega * change_x) * deltaTime;
    const temp_y = (currentVelocity.y + omega * change_y) * deltaTime;
    let temp_z = 0;
    if(hasZ) {
        // @ts-ignore
        temp_z = (currentVelocity.z + omega * change_z) * deltaTime;
    }

    currentVelocity.x = (currentVelocity.x - omega * temp_x) * exp;
    currentVelocity.y = (currentVelocity.y - omega * temp_y) * exp;
    if(hasZ) {
        // @ts-ignore
        currentVelocity.z = (currentVelocity.z - omega * temp_z) * exp;
    }

    output_x = target.x + (change_x + temp_x) * exp;
    output_y = target.y + (change_y + temp_y) * exp;
    if(hasZ) {
        // @ts-ignore
        output_z = target.z + (change_z + temp_z) * exp;
    }

    const origMinusCurrent_x = originalTo.x - current.x;
    const origMinusCurrent_y = originalTo.y - current.y;
    let origMinusCurrent_z = 0;
    if(hasZ) {
        // @ts-ignore
        origMinusCurrent_z = originalTo.z - current.z;
    }
    const outMinusOrig_x = output_x - originalTo.x;
    const outMinusOrig_y = output_y - originalTo.y;
    const outMinusOrig_z = output_z - originalTo.z;
    if (origMinusCurrent_x * outMinusOrig_x + origMinusCurrent_y * outMinusOrig_y + origMinusCurrent_z * outMinusOrig_z > 0)
    {
        output_x = originalTo.x;
        output_y = originalTo.y;
        output_z = originalTo.z;
        currentVelocity.x = (output_x - originalTo.x) / deltaTime;
        currentVelocity.y = (output_y - originalTo.y) / deltaTime;
        if(hasZ) {
            // @ts-ignore
            currentVelocity.z = (output_z - originalTo.z) / deltaTime;
        }
    }

    if(
        // Object.hasOwnProperty.call(current, "z")
        // @ts-ignore
        typeof current.z === "number"
    ) {
        return {
            x: output_x,
            y: output_y,
            z: output_z,
        } as T;
    } else {
        return {
            x: output_x,
            y: output_y,
        } as T;
    }
}

// public static Vector3 SmoothDamp(Vector3 current, Vector3 target, ref Vector3 currentVelocity, float smoothTime, [uei.DefaultValue("Mathf.Infinity")]  float maxSpeed, [uei.DefaultValue("Time.deltaTime")]  float deltaTime)
// {
//     float output_x = 0f;
//     float output_y = 0f;
//     float output_z = 0f;
//
//     // Based on Game Programming Gems 4 Chapter 1.10
//     smoothTime = Mathf.Max(0.0001F, smoothTime);
//     float omega = 2F / smoothTime;
//
//     float x = omega * deltaTime;
//     float exp = 1F / (1F + x + 0.48F * x * x + 0.235F * x * x * x);
//
//     float change_x = current.x - target.x;
//     float change_y = current.y - target.y;
//     float change_z = current.z - target.z;
//     Vector3 originalTo = target;
//
//     // Clamp maximum speed
//     float maxChange = maxSpeed * smoothTime;
//
//     float maxChangeSq = maxChange * maxChange;
//     float sqrmag = change_x * change_x + change_y * change_y + change_z * change_z;
//     if (sqrmag > maxChangeSq)
//     {
//         var mag = (float)Math.Sqrt(sqrmag);
//         change_x = change_x / mag * maxChange;
//         change_y = change_y / mag * maxChange;
//         change_z = change_z / mag * maxChange;
//     }
//
//     target.x = current.x - change_x;
//     target.y = current.y - change_y;
//     target.z = current.z - change_z;
//
//     float temp_x = (currentVelocity.x + omega * change_x) * deltaTime;
//     float temp_y = (currentVelocity.y + omega * change_y) * deltaTime;
//     float temp_z = (currentVelocity.z + omega * change_z) * deltaTime;
//
//     currentVelocity.x = (currentVelocity.x - omega * temp_x) * exp;
//     currentVelocity.y = (currentVelocity.y - omega * temp_y) * exp;
//     currentVelocity.z = (currentVelocity.z - omega * temp_z) * exp;
//
//     output_x = target.x + (change_x + temp_x) * exp;
//     output_y = target.y + (change_y + temp_y) * exp;
//     output_z = target.z + (change_z + temp_z) * exp;
//
//     // Prevent overshooting
//     float origMinusCurrent_x = originalTo.x - current.x;
//     float origMinusCurrent_y = originalTo.y - current.y;
//     float origMinusCurrent_z = originalTo.z - current.z;
//     float outMinusOrig_x = output_x - originalTo.x;
//     float outMinusOrig_y = output_y - originalTo.y;
//     float outMinusOrig_z = output_z - originalTo.z;
//
//     if (origMinusCurrent_x * outMinusOrig_x + origMinusCurrent_y * outMinusOrig_y + origMinusCurrent_z * outMinusOrig_z > 0)
//     {
//         output_x = originalTo.x;
//         output_y = originalTo.y;
//         output_z = originalTo.z;
//
//         currentVelocity.x = (output_x - originalTo.x) / deltaTime;
//         currentVelocity.y = (output_y - originalTo.y) / deltaTime;
//         currentVelocity.z = (output_z - originalTo.z) / deltaTime;
//     }
//
//     return new Vector3(output_x, output_y, output_z);
// }
