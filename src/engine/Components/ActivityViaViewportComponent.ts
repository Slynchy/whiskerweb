// this component sets activity for the parent based on visibility

import { Component } from "../Component";
import { ActivityViaViewportSystem } from "../Systems/ActivityViaViewportSystem";
import { Rectangle } from "pixi.js";

export class ActivityViaViewportComponent extends Component {
    public static readonly id: string = "ActivityViaViewportComponent";
    protected static readonly _system:
        typeof ActivityViaViewportSystem = ActivityViaViewportSystem;

    private _viewportRef: Rectangle = null;
    private _frameInterval: number = (Math.ceil(Math.random() * 3));
    private _frameCounter: number = 0;
    private _recursive: boolean = false;

    constructor(_viewportRef: Rectangle, _recursive?: boolean) {
        super();
        this._viewportRef = _viewportRef;
        this._recursive = _recursive;
    }

    onAttach(): void {
    }

    onComponentAttached(_componentId: string, _component: Component): void {
    }

    onDetach(): void {
    }

}
