import { IVector2 } from "../Types/IVector2";
import { Container } from "pixi.js";

/**
 * Returns where `_child`'s position is in `_parent`'s local coordinates, i.e. the value
 * `_child.position` would have if `_child` were a direct child of `_parent` (without moving on screen).
 * Every container in between is taken into account, including its scale, rotation and pivot.
 * `_parent` is normally an ancestor of `_child`, but any container works.
 * If `_child` has no parent, or `_parent` is its parent, this is just a copy of `_child.position`.
 */
export function getPositionRelativeToParent(
    _child: Container,
    _parent: Container,
): IVector2 {
    const from = _child.parent;
    if (!from || from === _parent) {
        return {x: _child.position.x, y: _child.position.y};
    }
    const res = _parent.toLocal(_child.position, from);
    return {x: res.x, y: res.y};
}
