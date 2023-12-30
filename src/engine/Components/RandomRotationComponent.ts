import { Component } from "../../../index";
import { RandomRotationSystem } from "../Systems/RandomRotationSystem";

export interface IRandomRotationConfig {
    angleDelta: number;
    speed: number;
    maxSpeed: number;
    minChangeDelay: number;
    maxChangeDelay: number;
}

export class RandomRotationComponent extends Component {

    public static readonly id: string = "RandomRotationComponent";
    public static readonly _system: typeof RandomRotationSystem = RandomRotationSystem;

    public config: IRandomRotationConfig = null;

    public _angleDelta: number = 25.0;
    public _speed: number = 4.0;
    public _maxSpeed: number = 2.0;
    public _minChangeDelay: number = 0.5;
    public _maxChangeDelay: number = 1.0;

    public _angleDeltaOverride: boolean = false;
    public _speedOverride: boolean = false;
    public _maxSpeedOverride: boolean = false;
    public _minChangeDelayOverride: boolean = false;
    public _maxChangeDelayOverride: boolean = false;

    public _initialAngle: number = 0;
    public _destAngle: number = 0;
    public _newDestCountdown: number = 0;
    public _velocity: number = 0;
    public _smoothTime: number = 0;

    public maxAngleDelta: number = 0;
    public speed: number = 0;
    public maxSpeed: number = 0;
    public minChangeDelay: number = 0;
    public maxChangeDelay: number = 0;

    constructor(_config?: IRandomRotationConfig) {
        super();
        this.config = _config || null;
        this._initFromConfig();
    }

    _initFromConfig(): void {
        if(!this.config)
            return;
        this.maxAngleDelta =
            (Boolean(this.config) && !this._angleDeltaOverride) ? this.config.angleDelta : this._angleDelta;
        this.speed =
            (Boolean(this.config) && !this._speedOverride) ? this.config.speed : this._speed;
        this.maxSpeed =
            (Boolean(this.config) && !this._maxSpeedOverride) ? this.config.maxSpeed : this._maxSpeed;
        this.minChangeDelay =
            (Boolean(this.config) && !this._minChangeDelay) ? this.config.minChangeDelay : this._minChangeDelay;
        this.maxChangeDelay =
            (Boolean(this.config) && !this._maxChangeDelay) ? this.config.maxChangeDelay : this._maxChangeDelay;
    }

    onAttach(): void {
        this._initialAngle = this.parent.rotation;
    }

    onComponentAttached(_componentId: string, _component: Component): void {
    }

    onDetach(): void {
    }

}
