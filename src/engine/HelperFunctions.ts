import { GameObject } from "./GameObject";
import {
    Container as PIXIContainer,
    Container as DisplayObject,
    FederatedEvent as PIXIInteractionEvent,
    ObservablePoint,
    Sprite,
    Sprite as PIXISprite,
    Container, Texture, Graphics
} from "pixi.js";
import { InteractionEvent } from "./Types/InteractionEvent";
import { SpriteComponent } from "./Components/SpriteComponent";
import { Engine } from "./Engine";
import { DIRECTION } from "./Types/Direction";
import { IVector2, IVector3 } from "../../index";
import * as TWEEN from '@tweenjs/tween.js';
import { AudioSingleton } from "./AudioSingleton";
import { Vector2 } from "../lib/Vector2";
import { ENGINE_DEBUG_MODE } from "./Constants/Constants";

export interface TooltipProperties {
    x: number;
    y: number;
    width: number;
    height: number;
    title: string;
    body: string;
    dontAddToUI?: boolean;
}

export interface ITweenAnimationReturnValue {
    cancel: () => void;
    progress: number;
    promise: Promise<void>;
}

declare const window: Window & {
    ENGINE: Engine;
};

export class HelperFunctions {
    constructor() {
        throw new Error("HelperFunctions class is intended to be static; no instances!");
    }

    public static isWebAssemblySupported(): boolean {
        try {
            if (typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function') {
                // WebAssembly is supported
                return true;
            }
        } catch (e) {
            // An error occurred, indicating WebAssembly is not supported
        }

        // WebAssembly is not supported
        return false;
    }

    public static traverseChildren<P extends PIXIContainer,
        C extends PIXIContainer>(
        baseObject: P | C,
        funcToCall: (e: C) => void
    ): void {
        funcToCall(baseObject as C);
        for (let i = 0; i < baseObject.children.length; i++) {
            HelperFunctions.traverseChildren(baseObject.children[i] as C, funcToCall);
        }
    }

    public static createCloseButton(): Sprite {
        const closeButton: Sprite =
                new Sprite(ENGINE.getPIXIResource("circle_black") as Texture);
        closeButton.anchor.set(0.5, 0.5);
        closeButton.scale.set(0.6, 0.6);

        const closeXGraphic = new Graphics();
        // closeXGraphic.lineStyle(3, 0x1a1a1a, 1);
        closeXGraphic.moveTo(0,0);
        closeXGraphic.lineTo(24, 24);
        closeXGraphic.moveTo(24,0);
        closeXGraphic.lineTo(0, 24);
        closeXGraphic.scale.set(2, 2);
        closeXGraphic.position.set(-24, -24);
        closeButton.addChild(closeXGraphic);

        return closeButton;
    }

    public static findPropByHierarchy(
        _targetHierarchy: string,
        _startingNode: GameObject,
        _hierarchyIndex: number = 0
    ): GameObject | null {
        if (_targetHierarchy === _startingNode.name || _targetHierarchy == "")
            return _startingNode;

        _hierarchyIndex++;
        const splitStr = _targetHierarchy.split("!");
        const currentTargetHierarchy = splitStr.slice(0, _hierarchyIndex).join("!");
        const objChildren = _startingNode.children;

        for (let i = 0; i < objChildren.length; i++) {
            const currElement = objChildren[i] as GameObject;
            if (currElement.name === currentTargetHierarchy) {
                return HelperFunctions.findPropByHierarchy(
                    _targetHierarchy,
                    currElement,
                    _hierarchyIndex
                );
            }
        }

        return null;
    }

    /**
     * Scales a target object based on specified width/height.
     * Use `null` in the targetSize object to scale with the other axis
     * Example: smartScale2D({x: 100, y: null}, aSprite);
     * @param targetSize IVector2 In pixels; width/height
     * @param obj PIXI.Sprite
     */
    public static smartScale2D(
        targetSize: IVector2, //
        obj: Sprite | Container
    ): void {
        let widthScale = typeof targetSize.x !== "undefined" ? (targetSize.x /
            // @ts-ignore
            (obj.texture?.width || obj.width)
        ) : null;
        let heightScale = typeof targetSize.y !== "undefined" ? (targetSize.y /
            // @ts-ignore
            (obj.texture?.height || obj.height)
        ) : null;

        if (widthScale && !heightScale) {
            heightScale = widthScale;
        } else if (heightScale && !widthScale) {
            widthScale = heightScale;
        }

        obj.scale.set(
            widthScale,
            heightScale,
        );
    }

    public static roundToSpecifiedDivider(num: number, div: number): number {
        return Math.round(num / div) * div;
    }

    public static isPromise(p: any): boolean {
        return (typeof p === 'object' && typeof p.then === 'function');
    }

    public static stopAllSoundsOfId(id: string): void {
        try {
            AudioSingleton.stopAllSoundsOfId(id);
        } catch(err) {
            console.warn(err);
        }
    }

    public static playSound_s(id: string, options?: { [key: string]: any }): Promise<string> {
        return AudioSingleton.playSound(id, options);
    }

    public static playSound(id: string, options?: { [key: string]: any }): Promise<string> {
        return AudioSingleton.playSound(id, options);
    }

    public static getDirectionFromOffset(_offset: IVector2): DIRECTION {
        const axis = _offset.x > _offset.y ? "x" : "y";

        if (axis === "x") {
            if (_offset[axis] > 0) {
                return DIRECTION.DOWN;
            } else {
                return DIRECTION.UP;
            }
        } else {
            if (_offset[axis] > 0) {
                return DIRECTION.RIGHT;
            } else {
                return DIRECTION.LEFT;
            }
        }
    }

    /**
     *
     * @param func Function which returns a boolean (if true, resolve the promise)
     * @param refreshRateMs Optional: how often in ms to call `func`
     * @param maxAttempts Optional: how many attempts before rejecting (if zero, go infinitely)
     */
    public static waitForTruth(func: () => boolean, refreshRateMs: number = 15, maxAttempts: number = 0): Promise<void> {
        return new Promise((resolve, reject) => {
            let counter = 0;
            const interval = setInterval(() => {
                if (maxAttempts !== 0 && counter >= maxAttempts) {
                    clearInterval(interval);
                    reject();
                } else if (func()) {
                    clearInterval(interval);
                    resolve();
                } else {
                    counter++;
                }
            }, refreshRateMs || 1);
        });
    }

    /**
     * Returns array of enum keys
     * @author https://www.petermorlion.com/iterating-a-typescript-enum/
     * @param obj
     */
    public static enumKeys<O extends object, K extends keyof O = keyof O>(obj: O): K[] {
        return Object.keys(obj).filter(k => Number.isNaN(+k)) as K[];
    }

    public static roundToDecimalPlaces(num: number, decimalPlaces: number = 1): number {
        const factor = (Math.pow(10, decimalPlaces));
        return Math.round(num * factor) / factor;
    }

    public static getMainCanvasElement(): HTMLCanvasElement {
        return document.getElementById("ui-canvas") as HTMLCanvasElement;
    }

    // public static NearestPointOnFiniteLine(start: Vector3, end: Vector3, pnt: Vector3): Vector3 {
    //     let line = end.sub(start);
    //     const len = Math.sqrt(line.x * line.x + line.y * line.y + line.z * line.z);
    //     line = line.normalize();
    //
    //     const v = pnt.sub(start);
    //     let d = v.dot(line);
    //     d = HelperFunctions.clamp(d, 0, len);
    //     return line.multiply(new Vector3(d, d, d)).add(start);
    // }

    public static clamp(val: number, min: number, max: number): number {
        return Math.min(Math.max(val, min), max);
    }

    public static makeInteractive(_obj: DisplayObject, _skipButtonMode?: boolean): void {
        _obj.interactive = _obj.interactiveChildren = true;
        _obj.cursor = _skipButtonMode ? "default" : "pointer";
    }

    public static makeUninteractive(_obj: DisplayObject): void {
        // @ts-ignore
        _obj.interactive = _obj.interactiveChildren = false;
    }

    public static parseInteractionEvent(ev: PIXIInteractionEvent, canvasWidth?: number, canvasHeight?: number): IVector2 {
        // const width = canvasWidth ? canvasWidth : parseInt(
        //     HelperFunctions.getMainCanvasElement().style.width
        // );
        // const height = canvasHeight ? canvasHeight : parseInt(
        //     HelperFunctions.getMainCanvasElement().style.height
        // );

        // For some reason this isn't needed anymore :shrug:
        const scaleFactor = 1; //HelperFunctions.calculateScaleFactor({x: width, y: height});
        // console.log(scaleFactor);

        return {
            x: Math.round(ev.pageX * scaleFactor),
            y: Math.round(ev.pageY * scaleFactor),
        };
    }

    public static getUICanvas(): HTMLCanvasElement {
        return document.getElementById("ui-canvas") as HTMLCanvasElement;
    }

    public static calculateScaleFactor(_screenSize: IVector2): number {
        let scaleFactor: number;
        const canvas3dWidth = _screenSize ? _screenSize.x : parseInt(
            HelperFunctions.getMainCanvasElement().style.width
        );
        const canvas3dHeight = _screenSize ? _screenSize.y : parseInt(
            HelperFunctions.getMainCanvasElement().style.height
        );
        switch (ENGINE["_autoResizeVal"]) {
            case "height":
                scaleFactor = canvas3dHeight / HelperFunctions.getUICanvas().height;
                break;
            case "none":
            case "width":
            default:
                scaleFactor = canvas3dWidth / HelperFunctions.getUICanvas().width;
                break;
        }
        return scaleFactor;
    }

    public static deg2rad(num: number): number {
        return num * (Math.PI / 180);
    }

    public static rad2deg(num: number): number {
        return num * (180 / Math.PI);
    }

    public static randomRange(min: number | IVector2, max?: number): number {
        if (typeof min === "number") {
            return (Math.random() * (max - min)) + min;
        } else {
            return (Math.random() * (min.y - min.x)) + min.x;
        }
    }

    public static removeFromStage(stage: Container, obj: DisplayObject | GameObject, unsafe?: boolean): void {
        if (unsafe || HelperFunctions.isDisplayObject(obj)) {
            stage.removeChild(obj as DisplayObject);
        } else if (HelperFunctions.isGameObject(obj)) {
            if ((obj as GameObject).hasComponent(SpriteComponent)) {
                const sprite: PIXISprite = ((obj as GameObject).getComponent(SpriteComponent) as SpriteComponent).getSpriteObj();
                if (sprite) stage.removeChild(sprite);
            } else {
                throw new Error("GameObject must have Sprite or Container component to be added to scene!");
            }
        } else if (!unsafe) {
            throw new Error("Invalid object attempted to add to scene");
        }
    }

    public static addToStage(stage: Container, obj: GameObject | Container | DisplayObject): void {
        // Sam - since making GameObject just extend Object3D, this function got a bit easier
        stage.addChild(obj);
    }

    public static formatTimeToHHMMSS(_time: number): string {
        const hours = Math.floor((_time / 1000 / 3600) % 24);
        return `${hours}:${HelperFunctions.formatTimeToMMSS(_time)}`;
    }

    /**
     * Modified from https://stackoverflow.com/questions/29816872/how-can-i-convert-milliseconds-to-hhmmss-format-using-javascript
     * @param _time
     */
    public static formatTimeToMMSS(_time: number): string {
        // 1- Convert to seconds:
        const seconds = Math.floor((_time / 1000) % 60);
        const minutes = Math.floor((_time / 1000 / 60) % 60);

        return `${
            minutes < 10 ? "0" + minutes : minutes
        }:${
            seconds < 10 ? "0" + seconds : seconds
        }`;
    }

    public static addToStage2D(stage: Container, obj: DisplayObject | GameObject, unsafe?: boolean): void {
        if (unsafe || HelperFunctions.isDisplayObject(obj)) {
            stage.addChild(obj as DisplayObject);
        } else if (HelperFunctions.isGameObject(obj)) {
            if ((obj as GameObject).hasComponent(SpriteComponent)) {
                const sprite: PIXISprite = ((obj as GameObject).getComponent(SpriteComponent) as SpriteComponent).getSpriteObj();
                if (sprite) stage.addChild(sprite);
            } else {
                throw new Error("GameObject must have Sprite or Container component to be added to scene!");
            }
        } else if (!unsafe) {
            throw new Error("Invalid object attempted to add to scene");
        }
    }

    public static async shakeObject(_target: Vector2, _iterations?: number): Promise<void> {
        const iterations: number = _iterations || 30;
        // @ts-ignore
        const origPos: Vector2 = {
            x: _target.x, y: _target.y
        };
        for(let n: number = 0; n < iterations; n++) {
            await HelperFunctions.lerpToPromise(
                _target,
                {
                    x: _target.x + ((Math.random() * 20) - 10),
                    y: _target.y + ((Math.random() * 20) - 10)
                },
                66
            );
            await HelperFunctions.lerpToPromise(
                _target,
                {
                    x: origPos.x,
                    y: origPos.y
                },
                66
            );
        }
        _target.x = origPos.x;
        _target.y = origPos.y;
    }

    public static rotateIVec2(_input: IVector2, _degrees: number): IVector2 {
        const angleRad = HelperFunctions.deg2rad(_degrees);
        return {
            x: _input.x * Math.cos(angleRad) - _input.y * Math.sin(angleRad),
            y: _input.x * Math.sin(angleRad) + _input.y * Math.cos(angleRad),
        };
    }

    public static getDirectionOfSwipe(
        _pointerUpEvent: PIXIInteractionEvent,
        _pointerDownPos: IVector2 | PIXIInteractionEvent,
        _scrSize?: IVector2
    ): DIRECTION {
        const parsedEvent: IVector2 = HelperFunctions.parseInteractionEvent(_pointerUpEvent, _scrSize?.x, _scrSize?.y);
        const eventCoords = new Vector2(parsedEvent.x, parsedEvent.y);

        let _direction: IVector2;
        if (!(_pointerDownPos instanceof PIXIInteractionEvent)) {
            _direction = eventCoords.sub(
                new Vector2(_pointerDownPos.x, _pointerDownPos.y)
            ).normalize();
        } else {
            const parsedDownEvent = HelperFunctions.parseInteractionEvent(_pointerDownPos);
            _direction = eventCoords.sub(new Vector2(
                parsedDownEvent.x,
                parsedDownEvent.y
            )).normalize();
        }

        const rotatedDirection = HelperFunctions.rotateIVec2(
            _direction,
            -20
        );

        let swipeDirection: DIRECTION;
        if (Math.abs(rotatedDirection.y) < Math.abs(rotatedDirection.x)) {
            if (
                rotatedDirection.x < 0
            ) {
                swipeDirection = DIRECTION.LEFT;
            } else {
                swipeDirection = DIRECTION.RIGHT;
            }
        } else {
            if (
                rotatedDirection.y < 0
            ) {
                swipeDirection = DIRECTION.UP;
            } else {
                swipeDirection = DIRECTION.DOWN;
            }
        }

        return swipeDirection;
    }

    public static lerp(v0: number, v1: number, t: number): number {
        return v0 * (1 - t) + v1 * t;
    }

    public static setPositionWithConstraint(_target: IVector2, _newVal: IVector2, _min: IVector2, _max: IVector2): void {
        _target.x = Math.round(
            Math.max(
                Math.min(
                    _max.x,
                    _newVal.x
                ),
                _min.x
            )
        );
        _target.y = Math.round(Math.max(
            Math.min(
                _max.y,
                _newVal.y
            ),
            _min.y
        ));
        return;
    }

    public static TWEENVec2AsPromise(
        _target: Vector2 | ObservablePoint | IVector2,
        _destVal: Vector2 | ObservablePoint | IVector2,
        _func: typeof TWEEN.Easing.Linear.None,
        _duration: number = 1000,
        _onTick?: (obj?: any, elapsed?: number) => boolean
    ): ITweenAnimationReturnValue {
        const retVal: ITweenAnimationReturnValue = {
            promise: null,
            cancel: null,
            progress: 0
        };
        let counter = 0;
        const onTick = !_onTick ? () => true : (obj?: any, elapsed?: number): boolean => {
            counter++;
            if (counter >= 2) {
                counter = 0;
                return _onTick(obj, elapsed);
            } else {
                return true;
            }
        };

        const xPromise = HelperFunctions.TWEENAsPromise(
            _target, "x", _destVal.x, _func, _duration, (e, d) => {
                retVal.progress = d;
                return onTick(e, d);
            }
        );
        const yPromise = HelperFunctions.TWEENAsPromise(
            _target, "y", _destVal.y, _func, _duration, onTick
        );

        retVal.promise = Promise.all([
            xPromise.promise,
            yPromise.promise,
        ]) as unknown as Promise<void>;
        retVal.cancel = () => {
            xPromise.cancel();
            yPromise.cancel();
        };

        return retVal;
    }

    // public static TWEENVec3AsPromise(
    //     _target: Vector3 | Euler | IVector3,
    //     _destVal: Vector3 | Euler | IVector3,
    //     _func: typeof TWEEN.Easing.Linear.None,
    //     _duration: number = 1000,
    //     _onTick?: (obj?: any, elapsed?: number) => boolean
    // ): ITweenAnimationReturnValue {
    //     const retVal: ITweenAnimationReturnValue = {
    //         promise: null,
    //         cancel: null,
    //         progress: 0
    //     };
    //     let counter = 0;
    //     const onTick = !_onTick ? () => true : (obj?: any, elapsed?: number): boolean => {
    //         counter++;
    //         if (counter >= 3) {
    //             counter = 0;
    //             return _onTick(obj, elapsed);
    //         } else {
    //             return true;
    //         }
    //     };
    //
    //     const xPromise = HelperFunctions.TWEENAsPromise(
    //         _target, "x", _destVal.x, _func, _duration, (e, d) => {
    //             retVal.progress = d;
    //             return onTick(e, d);
    //         }
    //     );
    //     const yPromise = HelperFunctions.TWEENAsPromise(
    //         _target, "y", _destVal.y, _func, _duration, onTick
    //     );
    //     const zPromise = HelperFunctions.TWEENAsPromise(
    //         _target, "z", _destVal.z, _func, _duration, onTick
    //     );
    //
    //     retVal.promise = Promise.all([
    //         xPromise.promise,
    //         yPromise.promise,
    //         zPromise.promise,
    //     ]) as unknown as Promise<void>;
    //     retVal.cancel = () => {
    //         xPromise.cancel();
    //         yPromise.cancel();
    //         zPromise.cancel();
    //     };
    //
    //     return retVal;
    // }

    /**
     * NOTE: There is no protection against calling `await` on this function
     * So if you wonder why your animation finishes instantly, it's because you
     * need to `await TWEENAsPromise(...).promise`.
     * @param _target
     * @param _key
     * @param _destVal
     * @param _func
     * @param _duration
     * @param _onTick
     * @param _postTick
     * @constructor
     */
    public static TWEENAsPromise(
        _target: any,
        _key: string,
        _destVal: number,
        _func: typeof TWEEN.Easing.Linear.None,
        _duration: number = 1000,
        _onTick?: (obj?: any, elapsed?: number) => boolean,
        _postTick?: (obj?: any, elapsed?: number) => void,
    ): ITweenAnimationReturnValue {
        const retVal: ITweenAnimationReturnValue = {
            promise: null,
            cancel: null,
            progress: 0
        };
        const start = {};
        const dest = {};
        let tween: TWEEN.Tween<{}>;
        // @ts-ignore
        start[_key] = _target[_key];
        // @ts-ignore
        dest[_key] = _destVal;

        tween = new TWEEN.Tween(start)
            .to(dest, _duration)
            .onUpdate((e, t) => {
                retVal.progress = t;
                const cont: boolean = _onTick ? _onTick(e, t) as boolean : true;
                if (cont) {
                    // @ts-ignore
                    _target[_key] = start[_key];
                    if(_postTick) {
                        _postTick(e, t);
                    }
                } else {
                    tween.stop();
                }
            })
            .easing(_func);

        let resolveEscape: Function;
        const promise = new Promise<void>((resolve) => {
            resolveEscape = resolve;
            tween.onComplete(() => {
                _target[_key] = _destVal;
                resolve();
            }).start(Date.now());
        });

        retVal.cancel = () => {
            tween.stop();
            resolveEscape();
        };
        retVal.promise = promise;

        return retVal;
    }

    public static async tryGetPIXIResource<T>(
        _key: string,
        _refreshRate: number = 333,
        _maxAttempts: number = 25,
    ): Promise<T | undefined> {
        let resource: T | undefined;
        try {
            await HelperFunctions.waitForTruth(() => {
                return Boolean(resource = window.ENGINE.getPIXIResource("gameLogo") as unknown as T);
            }, _refreshRate);
        } catch (err) {
            console.error(err);
        }
        return resource;
    }

    public static easeInBack(x: number): number {
        const c1 = 1.70158;
        const c3 = c1 + 1;

        return c3 * x * x * x - c1 * x * x;
    }

    public static async tweenScalarPromise(
        _target: any,
        _key: string,
        _destValue: number,
        _tweenFunc?: (v0: number, v1: number, t: number) => number,
        _speed?: number,
        _engine?: Engine
    ): Promise<void> {
        const speed: number = _speed || 0.01;
        const origValue: number = _target[_key];
        const tweenFunc: Function = _tweenFunc || HelperFunctions.lerp;
        let progress: number = 0;
        await new Promise((resolve2: Function): void => {
            let intervalID: unknown;
            intervalID = setInterval(() => {
                progress = Math.min(progress + (speed * (_engine?.deltaTime || 1)), 1);
                if (!_target) throw new Error("Missing target!");
                _target[_key] = tweenFunc(origValue, _destValue, progress);
                if (progress === 1) {
                    // @ts-ignore
                    clearInterval(intervalID);
                    resolve2();
                }
            }, 0);
        });
        _target[_key] = _destValue;
    }

    public static wait(ms: number): Promise<void> {
        return new Promise<void>((resolve) => {
            setTimeout(() => resolve(), ms);
        });
    }

    /**
     * @deprecated Use `HelperFunctions.TWEENVec3AsPromise`
     * @param _sprite
     * @param _destination
     * @param _duration
     */
    public static lerpToPromise(
        _sprite: Vector2 | ObservablePoint,
        _destination: { x: number, y: number, z?: number },
        _duration: number = 1000
    ): Promise<void> {

        return HelperFunctions.TWEENVec2AsPromise(
            _sprite as Vector2,
            _destination instanceof Vector2 ? _destination : new Vector2(_destination.x, _destination.y),
            TWEEN.Easing.Linear.None,
            _duration
        ).promise as unknown as Promise<void>;
    }

    /**
     * @param self
     * @param propKey
     */
    public static createInteractionEvent<T>(self: object, propKey: string): InteractionEvent<T> {
        return {
            add: (prop: T): string => {
                const key: string = Math.random().toString().slice(2);
                // @ts-ignore
                self[propKey][key] = (prop);
                return key;
            },
            remove: (prop: T | string): void => {
                if (typeof prop === "string") {
                    // @ts-ignore
                    if (self[propKey][prop]) {
                        // @ts-ignore
                        self[propKey][prop] = undefined;
                        return;
                    }
                } else {
                    // @ts-ignore
                    for (const f in self[propKey]) {
                        // @ts-ignore
                        if (Object.prototype.hasOwnProperty.call(self[propKey], f)) {
                            // @ts-ignore
                            if (self[propKey][f] === prop) {
                                // @ts-ignore
                                self[propKey][f] = undefined;
                                return;
                            }
                        }
                    }
                }
                throw new Error(`Failed to find ${propKey} event to remove`);
            }
        };
    }

    public static isGameObject(obj: unknown): boolean {
        return (obj instanceof GameObject);
    }

    public static isDisplayObject(obj: unknown): boolean {
        return (obj instanceof DisplayObject);
    }
}

if(ENGINE_DEBUG_MODE) {
    // @ts-ignore
    window["HelperFunctions"] = HelperFunctions;
}
