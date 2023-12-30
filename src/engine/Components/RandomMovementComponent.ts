import { Component, IVector2, System } from "../../../index";
import { RandomMovementSystem } from "../Systems/RandomMovementSystem";

export interface IRandomMovementConfig {
    distance: number;
    speed: number;
    maxSpeed: number;
    minChangeDelay: number;
    maxChangeDelay: number;
}

/**
 * Tried-out cloning C# code in a different way.
 * It doesn't really work. 3/10.
 */
export class RandomMovementComponent extends Component {

    public static id: string = "RandomMovementComponent";
    public static readonly _system: typeof System = RandomMovementSystem;

    public config: IRandomMovementConfig = null;

    public _distance: number = 1.0;
    public _speed: number = 2.0;
    public _maxSpeed: number = 2.0;
    public _minChangeDelay: number = 0.5;
    public _maxChangeDelay: number = 1.0;

    public _distanceOverride: boolean = false;
    public _speedOverride: boolean = false;
    public _maxSpeedOverride: boolean = false;
    public _minChangeDelayOverride: boolean = false;
    public _maxChangeDelayOverride: boolean = false;

    public _initialPos: IVector2 = {x: 0, y: 0};
    public _dest: IVector2 = {x: 0, y: 0};
    public _newDestCountdown: number = 0;
    public _velocity: IVector2 = {x: 0, y: 0};
    public _smoothTime: number = 0;

    public distance: number = 0;
    public speed: number = 0;
    public maxSpeed: number = 0;
    public minChangeDelay: number = 0;
    public maxChangeDelay: number = 0;

    constructor(_config?: IRandomMovementConfig) {
        super();
        this.config = _config || null;
        this._initFromConfig();
    }

    _initFromConfig(): void {
        if(!this.config)
            return;
        this.distance =
            (Boolean(this.config) && !this._distanceOverride) ? this.config.distance : this._distance;
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
        this._initialPos.x = this.parent.position.x;
        this._initialPos.y = this.parent.position.y;
    }

    onComponentAttached(_componentId: string, _component: Component): void {
    }

    onDetach(): void {
    }
}
