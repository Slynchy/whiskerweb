import { IVector2 } from "../Types/IVector2";

export function randomPointInsideUnitCircle(): IVector2 {
    const a = Math.random() * 2 * Math.PI;
    const r = Math.sqrt(Math.random());
    return {
        x: r * Math.cos(a),
        y: r * Math.sin(a),
    };
}
