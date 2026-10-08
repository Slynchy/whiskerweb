import { Component } from "../Component";
import { IVector2 } from "../Types/IVector2";
import { AnimationSystem } from "../Systems/AnimationSystem";
import { CurveInterpolator } from "curve-interpolator";
import { GameObject } from "../GameObject";
import {ENGINE_DEBUG_MODE} from "../Constants/Constants";

export enum InOutType {
    In,
    Out,
    InOut,
    None // pretty much just for Linear
}

export const InOutStringMap: Record<InOutType, string> = {
    [InOutType.In]: "In",
    [InOutType.Out]: "Out",
    [InOutType.InOut]: "InOut",
    [InOutType.None]: "None",
};

export enum EasingType {
    Linear,
    Quadratic,
    Cubic,
    Quartic,
    Quintic,
    Sinusoidal,
    Exponential,
    Circular,
    Elastic,
    Back,
    Bounce
}

export enum AnimationType {
    Position,
    Rotation
}

export enum RelativeType {
    Relative,
    Absolute
}

interface IAnimationNode {
    value: IVector2;
    time: number;
    // inWeight: IVector2;
    // outWeight: IVector2;
}

export interface IAnimationConfig {
    // easing: EasingType;
    // inOut: InOutType;
    name: string;
    eulerNodes: Record<string, IAnimationNode[]>;
    posNodes: Record<string, IAnimationNode[]>;
    scaleNodes: Record<string, IAnimationNode[]>;
    loop: boolean;
    speed: number;
}

export const EasingStringMap: Record<EasingType, string> = {
    [EasingType.Linear]: "Linear",
    [EasingType.Quadratic]: "Quadratic",
    [EasingType.Cubic]: "Cubic",
    [EasingType.Quartic]: "Quartic",
    [EasingType.Quintic]: "Quintic",
    [EasingType.Sinusoidal]: "Sinusoidal",
    [EasingType.Exponential]: "Exponential",
    [EasingType.Circular]: "Circular",
    [EasingType.Elastic]: "Elastic",
    [EasingType.Back]: "Back",
    [EasingType.Bounce]: "Bounce",
};

function logMissingAnimElement(_any: any): void {
    if (!ENGINE_DEBUG_MODE) return;
    console.error(_any);
}

export class AnimationComponent extends Component {
    public static readonly id: string = "AnimationComponent";
    public static readonly _system: typeof AnimationSystem = AnimationSystem;

    private _config: IAnimationConfig = null;
    public initialPos: Record<string, IVector2> = {};
    public initialAngle: Record<string, number> = {};
    public initialScale: Record<string, IVector2> = {};

    _cachedElements: Record<string, GameObject> = {};
    private _loggedMissing: Record<string, boolean> = {};

    public _time: number = 0;
    public _active: boolean = false;

    public posInterpolators: Record<string, CurveInterpolator> = {};
    public scaleInterpolators: Record<string, CurveInterpolator> = {};
    public angleInterpolators: Record<string, CurveInterpolator> = {};

    public get config(): IAnimationConfig {
        return this._config;
    }

    public set config(val: IAnimationConfig) {
        this._config = val;

        if (Object.keys(this._config.posNodes).length > 0) {
            Object.keys(this._config.posNodes).forEach((key) => {
                this.posInterpolators[key] = new CurveInterpolator(
                    this._config.posNodes[key].map((e) => [e.value.x, e.value.y]),
                    {
                        tension: 0.5,
                        closed: this._config.loop,
                    }
                );
            });
        }

        if (Object.keys(this._config.scaleNodes).length > 0) {
            Object.keys(this._config.scaleNodes).forEach((key) => {
                this.scaleInterpolators[key] = new CurveInterpolator(
                    this._config.scaleNodes[key].map((e) => [e.value.x, e.value.y]),
                    {
                        tension: 0.5,
                        closed: this._config.loop,
                    }
                );
            });
        }

        if (Object.keys(this._config.eulerNodes).length > 0) {
            Object.keys(this._config.eulerNodes).forEach((key) => {
                this.angleInterpolators[key] = new CurveInterpolator(
                    this._config.eulerNodes[key].map((e) => [e.value.x, 0]),
                    {
                        tension: 0.5,
                        closed: this._config.loop,
                    }
                );
            });
        }
    }

    constructor(_config: IAnimationConfig) {
        super();
        this.config = _config;
    }

    onAttach(): void {
        // Children added after this component (e.g. `new GameObject(label, [anim])`) aren't
        // there yet; anything not found here is looked up again by getTarget each step.
        Object.keys(this._config.posNodes).forEach((path) => {
            // fixme: this might be a bug; we may need to cache initialPos for root
            if(path === "root") return; // no need for anything here
            const found = this.getTarget(path, false);
            if (found && !this.initialPos[path])
                this.initialPos[path] = {x: found.position.x, y: found.position.y};
        });
        Object.keys(this._config.scaleNodes).forEach((path) => {
            if(path === "root") return; // no need for anything here
            const found = this.getTarget(path, false);
            if (found && !this.initialScale[path])
                this.initialScale[path] = {x: found.scale.x, y: found.scale.y};
        });
        Object.keys(this._config.eulerNodes).forEach((path) => {
            if(path === "root") return; // no need for anything here
            const found = this.getTarget(path, false);
            if (found && !this.initialAngle[path])
                this.initialAngle[path] = found.rotation;
        });
    }

    /**
     * Returns the GameObject animated by `path` ("root" is the parent), finding and caching it
     * on first use. Returns null if it isn't in the hierarchy (yet).
     * @param path Node path from the animation config
     * @param _logIfMissing Log (once per path, debug mode only) when it can't be found
     */
    public getTarget(path: string, _logIfMissing: boolean = true): GameObject | null {
        if (path === "root") return this.parent;
        let found: GameObject = this._cachedElements[path];
        if (!found) {
            const newPath =
                (this.parent.label + "!" + path)
                    .replace(/\//g, "!")
                    .replace(/ /g, "_");
            found = AnimationSystem.findInChildren(this, newPath);
            if (!found) {
                if (_logIfMissing && !this._loggedMissing[path]) {
                    this._loggedMissing[path] = true;
                    logMissingAnimElement(newPath);
                }
                return null;
            }
            this._cachedElements[path] = found;
        }
        return found;
    }

    public setIsActive(val: boolean): void {
        this._active = val;
    }

    // public get currentTargetValue(): IVector2 | null {
    //     return this.isActive() ? this._config.nodes[this.currentNode].value : null;
    // }

    // public get currentNode(): number {
    //     for (let i = 1; i < this._config.nodes.length; i++) {
    //         if (this._time < this._config.nodes[i].time) {
    //             return i;
    //         }
    //     }
    //     return this._config.nodes.length;
    // }

    public isActive(): boolean {
        return this._config && this._active;
    }

    onComponentAttached(_componentId: string, _component: Component): void {
    }

    onDetach(): void {
    }

}
