import { GameObject } from "./GameObject";
import {
    Container as PIXIContainer,
    Container as DisplayObject,
    FederatedEvent as PIXIInteractionEvent,
    ObservablePoint,
    Sprite,
    Container, Texture, Graphics
} from "pixi.js";
import { InteractionEvent } from "./Types/InteractionEvent";
import { Engine } from "./Engine";
import { DIRECTION } from "./Types/Direction";
import { IVector2 } from "./Types/IVector2";
import { Easing, Tween } from "@tweenjs/tween.js";
import { AudioSingleton } from "./AudioSingleton";
import { Vector2 } from "../lib/Vector2";
import { ENGINE_DEBUG_MODE } from "./Constants/Constants";
import { getEasingFunction, TEasingFunction, TWEENDirection, TWEENFunctions } from "./HelperFunctions/TWEENFunctions";
import { tweenGroup } from "./TweenGroup";
import { getMainCanvasElement } from "./HelperFunctions/getMainCanvasElement";
import { mathClamp } from "./HelperFunctions/mathClamp";
import { uid } from "./HelperFunctions/uid";
import { padTwoDigits } from "./HelperFunctions/timeFormatting";

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
    /**
     * Stops the tween where it is (the target keeps its current value, it does *not* jump to the end)
     * and resolves `promise`. Safe to call more than once, or after the tween has finished.
     */
    cancel: () => void;
    /** Elapsed fraction of the tween's duration, 0 to 1 */
    progress: number;
    /** Resolves when the tween completes, is cancelled, or is stopped by its `_onTick` returning false */
    promise: Promise<void>;
}

// declare const window: Window & {
//     ENGINE: Engine;
// };

/**
 * The easing function for a tween helper's `_func` argument: either an easing function itself
 * or a `{ function, direction }` pair naming one of tween.js' `Easing` groups.
 */
function resolveEasing(
    _func: TEasingFunction | { function: TWEENFunctions; direction: TWEENDirection; }
): TEasingFunction {
    return typeof _func === "function" ? _func : getEasingFunction(_func.function, _func.direction);
}

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
        closeXGraphic.moveTo(0,0);
        closeXGraphic.lineTo(24, 24);
        closeXGraphic.moveTo(24,0);
        closeXGraphic.lineTo(0, 24);
        // PIXI v8: paths are only drawn once stroked
        closeXGraphic.stroke({ width: 3, color: 0x1a1a1a, alpha: 1 });
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
        if (_targetHierarchy === _startingNode.label || _targetHierarchy == "")
            return _startingNode;

        _hierarchyIndex++;
        const splitStr = _targetHierarchy.split("!");
        const currentTargetHierarchy = splitStr.slice(0, _hierarchyIndex).join("!");
        const objChildren = _startingNode.children;

        for (let i = 0; i < objChildren.length; i++) {
            const currElement = objChildren[i] as GameObject;
            if (currElement.label === currentTargetHierarchy) {
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

    /**
     * @deprecated Use `HelperFunctions.playSound` (identical)
     */
    public static playSound_s(id: string, options?: { [key: string]: any }): Promise<string> {
        return HelperFunctions.playSound(id, options);
    }

    public static playSound(id: string, options?: { [key: string]: any }): Promise<string> {
        return AudioSingleton.playSound(id, options);
    }

    /**
     * Returns the dominant direction of an offset in screen space (+y is down),
     * matching `getDirectionOfSwipe`. Ties go to the vertical axis.
     * @param _offset
     */
    public static getDirectionFromOffset(_offset: IVector2): DIRECTION {
        if (Math.abs(_offset.x) > Math.abs(_offset.y)) {
            return _offset.x < 0 ? DIRECTION.LEFT : DIRECTION.RIGHT;
        } else {
            return _offset.y < 0 ? DIRECTION.UP : DIRECTION.DOWN;
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

    /**
     * Returns the engine's canvas (falling back to the element with id "ui-canvas"), or null if there is none yet.
     * @deprecated Use `Helpers.getMainCanvasElement`
     */
    public static getMainCanvasElement(): HTMLCanvasElement {
        return getMainCanvasElement();
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

    /**
     * Limits `val` to [min, max]. If min > max, values below `min` give `min` and every other value gives `max`.
     * @deprecated Use `Helpers.mathClamp`
     */
    public static clamp(val: number, min: number, max: number): number {
        return mathClamp(val, min, max);
    }

    public static makeInteractive(_obj: DisplayObject, _skipButtonMode?: boolean): void {
        _obj.eventMode = "static";
        _obj.interactiveChildren = true;
        _obj.cursor = _skipButtonMode ? "default" : "pointer";
    }

    public static makeUninteractive(_obj: DisplayObject): void {
        // "passive" is what the deprecated `interactive = false` maps to in PIXI v8
        _obj.eventMode = "passive";
        _obj.interactiveChildren = false;
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

    /**
     * @deprecated Use `Helpers.getMainCanvasElement` (this is the same canvas)
     */
    public static getUICanvas(): HTMLCanvasElement {
        return getMainCanvasElement();
    }

    public static calculateScaleFactor(_screenSize: IVector2): number {
        let scaleFactor: number;
        const canvas = getMainCanvasElement();
        const canvas3dWidth = _screenSize ? _screenSize.x : parseInt(
            canvas.style.width
        );
        const canvas3dHeight = _screenSize ? _screenSize.y : parseInt(
            canvas.style.height
        );
        switch (ENGINE["autoResize"]) {
            case "height":
                scaleFactor = canvas3dHeight / canvas.height;
                break;
            case "none":
            case "width":
            default:
                scaleFactor = canvas3dWidth / canvas.width;
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

    /**
     * Removes `obj` (any PIXI container, including a GameObject) from `stage`.
     * Throws if `obj` isn't a container, unless `unsafe` is set.
     */
    public static removeFromStage(stage: Container, obj: DisplayObject | GameObject, unsafe?: boolean): void {
        // GameObject extends Container, so it passes the container check
        if (!unsafe && !HelperFunctions.isDisplayObject(obj)) {
            throw new Error("Invalid object attempted to remove from scene");
        }
        stage.removeChild(obj);
    }

    public static addToStage(stage: Container, obj: GameObject | Container | DisplayObject): void {
        // Sam - since making GameObject just extend Object3D, this function got a bit easier
        stage.addChild(obj);
    }

    /**
     * Formats a *duration* in ms as HH:MM:SS, e.g. 3723000 -> "01:02:03".
     * Hours don't wrap at 24 (e.g. 25 hours is "25:00:00").
     * To format a point in time (a timestamp) as a clock time, use `Helpers.formatTimestampToHHMMSS`.
     * @param _time Duration in milliseconds
     */
    public static formatTimeToHHMMSS(_time: number): string {
        const hours = Math.floor(_time / 1000 / 3600);
        return `${padTwoDigits(hours)}:${HelperFunctions.formatTimeToMMSS(_time)}`;
    }

    /**
     * Formats a *duration* in ms as MM:SS, e.g. 63000 -> "01:03". Minutes wrap at 60 (hours are dropped);
     * use `formatTimeToHHMMSS` for longer durations.
     * To format a point in time (a timestamp) as a clock time, use `Helpers.formatTimestampToHHMM`.
     * Modified from https://stackoverflow.com/questions/29816872/how-can-i-convert-milliseconds-to-hhmmss-format-using-javascript
     * @param _time Duration in milliseconds
     */
    public static formatTimeToMMSS(_time: number): string {
        const seconds = Math.floor((_time / 1000) % 60);
        const minutes = Math.floor((_time / 1000 / 60) % 60);
        return `${padTwoDigits(minutes)}:${padTwoDigits(seconds)}`;
    }

    /**
     * Adds `obj` (any PIXI container, including a GameObject) to `stage`.
     * Throws if `obj` isn't a container, unless `unsafe` is set.
     */
    public static addToStage2D(stage: Container, obj: DisplayObject | GameObject, unsafe?: boolean): void {
        // GameObject extends Container, so it passes the container check
        if (!unsafe && !HelperFunctions.isDisplayObject(obj)) {
            throw new Error("Invalid object attempted to add to scene");
        }
        stage.addChild(obj);
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

    /**
     * Tweens `_target.x` and `_target.y` together. See `TWEENAsPromise` for the return value.
     * @param _onTick Optional: called once per frame, after x has been updated and before y is;
     *  return false to stop both axes where they are (this resolves the promise).
     */
    public static TWEENVec2AsPromise(
        _target: Vector2 | ObservablePoint | IVector2,
        _destVal: Vector2 | ObservablePoint | IVector2,
        _func: TEasingFunction | {
            function: TWEENFunctions;
            direction: TWEENDirection;
        },
        _duration: number = 1000,
        _onTick?: (obj?: any, elapsed?: number) => boolean
    ): ITweenAnimationReturnValue {
        const retVal: ITweenAnimationReturnValue = {
            promise: null,
            cancel: null,
            progress: 0
        };

        // Both axes are in the engine's tween group on the same clock, so x and y tick in the same
        // frame (x first: the group updates tweens in creation order). _onTick runs once per frame,
        // on y's tick; if it returns false, y stops itself and x is cancelled here, so neither axis
        // carries on to the end value.
        const easing = resolveEasing(_func);
        const xPromise = HelperFunctions.TWEENAsPromise(
            _target, "x", _destVal.x, easing, _duration, (e, d) => {
                retVal.progress = d;
                return true;
            }
        );
        const yPromise = HelperFunctions.TWEENAsPromise(
            _target, "y", _destVal.y, easing, _duration, !_onTick ? undefined : (e, d) => {
                const cont: boolean = _onTick(e, d);
                if (!cont) {
                    xPromise.cancel();
                }
                return cont;
            }
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
    //     _func: TEasingFunction,
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
     *
     * `.promise` resolves when the tween completes (the target is set to `_destVal`), when
     * `.cancel()` is called, or when `_onTick` returns false. Cancelling or stopping leaves the
     * target at its current value rather than jumping to `_destVal`.
     * The tween runs in the engine's tween group (`tweenGroup`), so it only advances while the engine
     * ticker is running and is paused by `engine.pause()`; it leaves the group once it finishes or stops.
     * @param _target
     * @param _key
     * @param _destVal
     * @param _func An easing function (e.g. `Easing.Quadratic.Out`) or a `{ function, direction }` pair
     * @param _duration In ms
     * @param _onTick Optional: called every update before the value is applied; return false to stop the tween
     * @param _postTick Optional: called every update after the value is applied
     * @constructor
     */
    public static TWEENAsPromise(
        _target: any,
        _key: string,
        _destVal: number,
        _func: TEasingFunction | {
            function: TWEENFunctions;
            direction: TWEENDirection;
        },
        _duration: number = 1000,
        _onTick?: (obj?: any, elapsed?: number) => boolean,
        _postTick?: (obj?: any, elapsed?: number) => void,
    ): ITweenAnimationReturnValue {
        const retVal: ITweenAnimationReturnValue = {
            promise: null,
            cancel: null,
            progress: 0
        };
        const start: Record<string, number> = { [_key]: _target[_key] };
        const dest: Record<string, number> = { [_key]: _destVal };

        let resolvePromise: () => void;
        const promise = new Promise<void>((resolve) => {
            resolvePromise = resolve;
        });
        // Set once the promise has resolved, by completing, stopping or cancelling
        let settled = false;
        const settle = (): void => {
            if (settled) return;
            settled = true;
            resolvePromise();
        };

        const tween: Tween<Record<string, number>> = new Tween(start)
            .to(dest, _duration)
            .easing(resolveEasing(_func))
            .onUpdate((e, t) => {
                retVal.progress = t;
                const cont: boolean = _onTick ? _onTick(e, t) as boolean : true;
                if (cont) {
                    _target[_key] = start[_key];
                    if(_postTick) {
                        _postTick(e, t);
                    }
                } else {
                    // Fires onStop, which resolves the promise
                    tween.stop();
                }
            })
            .onStop(() => {
                tweenGroup.remove(tween);
                settle();
            })
            .onComplete(() => {
                tweenGroup.remove(tween);
                // tween.js still calls onComplete if _onTick stopped it on the final update
                if (settled) return;
                _target[_key] = _destVal;
                settle();
            });
        // tween.js doesn't add new tweens to any group; the engine updates (and pauses) tweenGroup
        tweenGroup.add(tween);
        // No time argument: uses tween.js' default clock (performance.now), which the engine updates tweenGroup with
        tween.start();

        retVal.cancel = () => {
            // stop() only fires onStop while the tween is playing (or paused), so settle here too
            tween.stop();
            tweenGroup.remove(tween);
            settle();
        };
        retVal.promise = promise;

        return retVal;
    }

    /**
     * Polls the loader for a PIXI resource until it exists.
     * @param _key Resource key
     * @param _refreshRate How often to check, in ms
     * @param _maxAttempts How many checks before giving up (0 = forever)
     * @returns The resource, or undefined if it never appeared
     */
    public static async tryGetPIXIResource<T>(
        _key: string,
        _refreshRate: number = 333,
        _maxAttempts: number = 25,
    ): Promise<T | undefined> {
        let resource: T | undefined;
        try {
            await HelperFunctions.waitForTruth(() => {
                // hasPIXIResource first, so polling doesn't log a "missing texture" warning every attempt
                return ENGINE.hasPIXIResource(_key) &&
                    Boolean(resource = ENGINE.getPIXIResource(_key) as unknown as T);
            }, _refreshRate, _maxAttempts);
        } catch (err) {
            console.error(`Gave up waiting for PIXI resource "${_key}" after ${_maxAttempts} attempts`);
        }
        return resource;
    }

    /**
     * @deprecated Use tween.js' `Easing.Back.In` (the same curve)
     */
    public static easeInBack(x: number): number {
        return Easing.Back.In(x);
    }

    /**
     * Tweens `_target[_key]` to `_destValue`, then sets it to exactly `_destValue` and resolves.
     * Runs on the engine's tween group via `TWEENAsPromise` (so it follows the ticker and `engine.pause()`).
     * @param _tweenFunc Optional: interpolation `(from, to, t) => value`, called with t going linearly
     *  from 0 to 1; defaults to `HelperFunctions.lerp`
     * @param _speed Optional: fraction of the tween done per 60 fps frame (default 0.01, i.e. 100 frames,
     *  about 1.67 s); the duration is `1000 / (60 * _speed)` ms
     * @param _engine Unused; kept for compatibility (timing now comes from the engine's tween group)
     */
    public static async tweenScalarPromise(
        _target: any,
        _key: string,
        _destValue: number,
        _tweenFunc?: (v0: number, v1: number, t: number) => number,
        _speed?: number,
        _engine?: Engine
    ): Promise<void> {
        const speed: number = _speed || 0.01;
        const duration: number = Math.max(0, 1000 / (60 * speed));
        const origValue: number = _target[_key];
        const tweenFunc = _tweenFunc || HelperFunctions.lerp;
        // Tween a 0-1 progress value linearly and map it through tweenFunc onto the target
        const progress = { t: 0 };
        await HelperFunctions.TWEENAsPromise(
            progress, "t", 1, Easing.Linear.None, duration, undefined,
            (_obj, t) => {
                _target[_key] = tweenFunc(origValue, _destValue, t);
            }
        ).promise;
        _target[_key] = _destValue;
    }

    public static wait(ms: number): Promise<void> {
        return new Promise<void>((resolve) => {
            setTimeout(() => resolve(), ms);
        });
    }

    /**
     * Linearly tweens x and y of `_sprite` to `_destination` (z is ignored) over `_duration` ms,
     * on the engine's tween group.
     * @deprecated Use `HelperFunctions.TWEENVec2AsPromise(_sprite, _destination, Easing.Linear.None, _duration).promise`
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
            _sprite,
            _destination,
            Easing.Linear.None,
            _duration
        ).promise;
    }

    /**
     * @param self
     * @param propKey
     */
    public static createInteractionEvent<T>(self: object, propKey: string): InteractionEvent<T> {
        return {
            add: (prop: T): string => {
                const key: string = uid();
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
