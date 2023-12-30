import { IVector2 } from "../Types/IVector2";
import { GameObject } from "../GameObject";
import { Container } from "pixi.js";

export function getPositionRelativeToParent(
    _child: Container,
    _parent: Container,
): IVector2 {
    const res = {x: _child.position.x, y: _child.position.y};

    let currParent = _child.parent;
    while(currParent !== _parent && Boolean(currParent)) {
        res.x += currParent.position.x;
        res.y += currParent.position.y;
        currParent = currParent.parent;
    }

    return res;
}
