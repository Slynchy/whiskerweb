import { System } from "./System";
import { Component } from "../Component";
import { GenericAnimationComponent } from "../Components/GenericAnimationComponent";

export class GenericAnimationSystem extends System {
    public static destroy(_component: Component): void {
        super.destroy(_component);
    }

    public static onAwake(_component: GenericAnimationComponent): void {
    }

    /**
     * Progress runs 0 -> 1. When looping it ping-pongs: `_isLooping` is true while it runs
     * back from 1 to 0. A non-looping animation calls onDone (removing the component) once
     * it has ticked at 1.
     */
    public static onStep(_dt: number, _component: GenericAnimationComponent): void {
        const reversing = _component._loop && _component._isLooping;
        let progress = _component._progress + (_component._speed * (_dt / 100)) * (reversing ? -1 : 1);

        if (progress >= 1) {
            progress = 1;
            if (_component._loop) _component._isLooping = true;
        } else if (progress <= 0) {
            progress = 0;
            _component._isLooping = false;
        }

        _component._progress = progress;
        _component.onTick(_dt, progress);

        if (!_component._loop && _component.isDone) {
            GenericAnimationSystem.onDone(_component);
        }
    }

    public static onDestroy(_component: Component): void {
    }

    public static onEnable(_component: Component): void {
    }

    public static onDisable(_component: Component): void {
    }

    private static onDone(_component: GenericAnimationComponent): void {
        // onTick may have destroyed the GameObject already
        if (!_component.parent || _component.parent.destroyed) return;
        _component.parent.removeComponent(_component);
    }
}
