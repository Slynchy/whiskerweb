import { System } from "./System";
import { AnimationComponent, AnimationType, RelativeType } from "../Components/AnimationComponent";
import { GameObject } from "../GameObject";
import { HelperFunctions } from "../HelperFunctions";
import { ENGINE_DEBUG_MODE } from "../Constants/Constants";
import { OccurrencesInString } from "../../lib/OccurrencesInString";

export class AnimationSystem extends System {
    public static destroy(_component: AnimationComponent): void {
        super.destroy(_component);
    }

    public static onAwake(_component: AnimationComponent): void {
        super.onAwake(_component);
    }

    public static findInChildren(_component: AnimationComponent, path: string): GameObject | null {
        const index = OccurrencesInString(
            _component.parent.name,
            "!",
            false
        ) + 1;
        return HelperFunctions.findPropByHierarchy(
            path,
            _component.parent,
            index
        );
    }

    public static onStep(_dt: number, _component: AnimationComponent): void {
        super.onStep(_dt, _component);
        if (!_component.isActive()) return;

        if(!_component.parent.isActive()) {
            return;
        }

        _component._time = // Math.min(
            _component._time + ((ENGINE.getTicker().elapsedMS / 1000) * _component.config.speed);
        // 1
        // );
        if (_component._time > 1) {
            if (_component.config.loop) {
                _component._time -= Math.floor(_component._time); // this makes it between 0 and 1
            } else {
                _component._time = 1;
            }
        }

        Object.keys(_component.config.posNodes)
            .forEach((e) => {
                const current = _component.config.posNodes[e];
                const point = _component.posInterpolators[e].getPointAt(_component._time);
                const target = _component._cachedElements[e] || (e === "root" ? _component.parent : null);
                if (!target) {
                    if (ENGINE_DEBUG_MODE) {
                        // debugger;
                    }
                    return;
                }
                target.position.set(
                    (point[0] * 100), // adjust for pixel size
                    (point[1] * -100) // todo: actually get this info from Unity?
                );
            });
        Object.keys(_component.config.scaleNodes)
            .forEach((e) => {
                const current = _component.config.scaleNodes[e];
                const point = _component.scaleInterpolators[e].getPointAt(_component._time);
                const target = _component._cachedElements[e] || (e === "root" ? _component.parent : null);
                if (!target) return;
                // if (_component.config.relativeType === RelativeType.Relative) {
                target.scale.set(
                    (1 - ((1 - point[1]) * 0.75)),
                    (1 - ((1 - point[0]) * 0.75)),
                );
            });
        Object.keys(_component.config.eulerNodes)
            .forEach((e) => {
                const current = _component.config.eulerNodes[e];
                const point = _component.angleInterpolators[e].getPointAt(_component._time);
                const target = _component._cachedElements[e] || (e === "root" ? _component.parent : null);
                if (!target) return;
                target.rotation = -HelperFunctions.deg2rad(point[0]);
            });

        // const currentNode = _component.currentNode;
        // if (currentNode >= _component.config.nodes.length) {
        //     if (_component.config.loop) {
        //         _component._time = 0;
        //     } else {
        //         // set to final pos here
        //         _component.setIsActive(false);
        //     }
        // } else {
        //     const progress = (
        //         _component._time - _component.config.nodes[currentNode - 1].time
        //     ) / (
        //         _component.config.nodes[currentNode].time - _component.config.nodes[currentNode - 1].time
        //     );
        //     const parsedProgress =
        //         // @ts-ignore
        //         Easing[
        //             EasingStringMap[_component.config.easing]
        //             ][
        //             InOutStringMap[_component.config.inOut]
        //             ](progress);
        //
        //     const diffX = _component.config.nodes[currentNode].value.x - _component.config.nodes[currentNode - 1].value.x;
        //     const diffY = _component.config.nodes[currentNode].value.y - _component.config.nodes[currentNode - 1].value.y;
        //     _component.parent.position.set(
        //         _component.config.nodes[currentNode - 1].value.x + (diffX * parsedProgress),
        //         _component.config.nodes[currentNode - 1].value.y + (diffY * parsedProgress),
        //     );
        // }
    }

    public static onDestroy(_component: AnimationComponent): void {
        super.onDestroy(_component);
    }

    public static onEnable(_component: AnimationComponent): void {
        super.onDestroy(_component);
    }

    public static onDisable(_component: AnimationComponent): void {
        super.onDestroy(_component);
    }
}
