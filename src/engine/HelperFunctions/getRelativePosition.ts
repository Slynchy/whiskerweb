import {IVector2} from "../Types/IVector2";
import {Container} from "pixi.js";

export function getRelativePosition(_startPos: IVector2, _targetObj: Container) {
    const result = Object.assign({}, _startPos);
    let parent = _targetObj.parent;
    while(parent) {
        result.x -= parent.position.x;
        result.y -= parent.position.y;
        parent = parent.parent;
    }
    return result;
}