
import { Component } from "../Component";
import { System } from "../Systems/System";
import { Bounds, Rectangle } from "pixi.js";
import { ScaleElementOnClickSystem } from "../Systems/ScaleElementOnClickSystem";
import { IVector2 } from "../Types/IVector2";
import { ITweenAnimationReturnValue } from "../HelperFunctions";

export class ScaleElementOnClickComponent extends Component {
    public static readonly id: string = "ScaleElementOnClickComponent";
    protected static readonly _system:
        typeof ScaleElementOnClickSystem = ScaleElementOnClickSystem;

    private startPos: IVector2 = null;
    private startSize: IVector2 = null;
    private scaleAnim: ITweenAnimationReturnValue;

    public scaleFactor: number;

    constructor(_scaleFactor: number = 0.9) {
        super();
        this.scaleFactor = _scaleFactor;
    }

    public cancel(): void {
        if(this.scaleAnim) {
            this.scaleAnim.cancel();
        }
    }

    onAttach(): void {

    }

    onComponentAttached(_componentId: string, _component: Component): void {
    }

    onDetach(): void {
    }

}
