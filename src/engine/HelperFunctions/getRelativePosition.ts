import {IVector2} from "../Types/IVector2";
import {Container} from "pixi.js";

/**
 * Converts a global (stage) position into the coordinate space `_targetObj.position` is in
 * (its parent's local space), so setting `_targetObj.position` to the result puts it at `_startPos`.
 * Takes the scale, rotation and pivot of every ancestor into account.
 * Returns a copy of `_startPos` (any extra properties are kept) with x and y converted;
 * if `_targetObj` has no parent, x and y are unchanged.
 */
export function getRelativePosition(_startPos: IVector2, _targetObj: Container): IVector2 {
    const result = Object.assign({}, _startPos);
    const parent = _targetObj.parent;
    if (parent) {
        const local = parent.toLocal(_startPos);
        result.x = local.x;
        result.y = local.y;
    }
    return result;
}
