import {Container} from "pixi.js";

export function bringToFront<T extends Container>(_target: T) {
    if(_target.parent) {
        const parent = _target.parent;
        parent.removeChild(_target);
        parent.addChild(_target);
    }
}