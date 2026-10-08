import {Container, FederatedEvent as PIXIInteractionEvent} from "pixi.js";
import {HelperFunctions} from "../HelperFunctions";
import isMobile from "is-mobile";
import {isTouchDevice} from "./isTouchDevice";

interface IButtonifyState {
    pointerOver: boolean;
    pointerDown: boolean;
}

type ButtonifyEventName = "pointerup" | "pointerdown" | "pointerover" | "pointerout" | "pointerupoutside" | "pointermove";
type ButtonifyListener = (ev: PIXIInteractionEvent) => void;

// The unbind function of each target's current binding, so a second buttonify() call can replace it
const _bindings: WeakMap<Container, () => void> = new WeakMap();

/**
 * Makes each target interactive and adds the listeners, replacing any earlier buttonify() binding on it.
 * @returns A function that removes this call's listeners from every target that still has this binding
 */
function bindTargets<T extends Container>(
    _targets: T[],
    _listeners: Array<[ButtonifyEventName, ButtonifyListener]>,
    _disableButtonMode?: boolean
): () => void {
    const unbinds: Array<() => void> = [];
    for (let i = 0; i < _targets.length; i++) {
        const target = _targets[i];
        const previousUnbind = _bindings.get(target);
        if (previousUnbind) previousUnbind();

        const cursorBeforeBinding = target.cursor;
        HelperFunctions.makeInteractive(target, _disableButtonMode);
        _listeners.forEach(([event, listener]) => target.on(event, listener));

        const unbind = (): void => {
            // Do nothing if this binding was already removed or replaced by a later buttonify() call
            if (_bindings.get(target) !== unbind) return;
            _bindings.delete(target);
            _listeners.forEach(([event, listener]) => target.off(event, listener));
            target.cursor = cursorBeforeBinding;
        };
        _bindings.set(target, unbind);
        unbinds.push(unbind);
    }

    return () => unbinds.forEach((unbind) => unbind());
}

function buttonify_mobile<T extends Container>(
    _target: T | T[],
    _settings: {
        disableButtonMode?: boolean;
        trackMovementOutsideElement?: boolean;

        onFire: (ev: PIXIInteractionEvent, _state: IButtonifyState) => void;

        onPointerUp?: (ev: PIXIInteractionEvent, _state: IButtonifyState) => void;
        onPointerDown?: (ev: PIXIInteractionEvent, _state: IButtonifyState) => void;
        onPointerOver?: (ev: PIXIInteractionEvent, _state: IButtonifyState) => void;
        onPointerOut?: (ev: PIXIInteractionEvent, _state: IButtonifyState) => void;
        onPointerMove?: (ev: PIXIInteractionEvent, _state: IButtonifyState) => void;
    }
): () => void {
    const state: IButtonifyState = {
        pointerOver: false,
        pointerDown: false,
    };
    let pointerMove = null;
    if(_settings.onPointerMove) {
        pointerMove = (ev: PIXIInteractionEvent) => {
            if(
                !_settings.trackMovementOutsideElement
            ) return;
            _settings.onPointerMove(ev, state);
        };
    }
    const pointerUp = (ev: PIXIInteractionEvent) => {
        if(_settings.onPointerUp)
            _settings.onPointerUp(ev, state);
        if(_settings.onPointerOut)
            _settings.onPointerOut(ev, state);
        if(state.pointerDown) {
            _settings.onFire(ev, state);
        }
        state.pointerDown = false;
    };
    const pointerDown = (ev: PIXIInteractionEvent) => {
        if(_settings.onPointerDown)
            _settings.onPointerDown(ev, state);
        if(_settings.onPointerOver)
            _settings.onPointerOver(ev, state);
        state.pointerDown = true;
    };

    const listeners: Array<[ButtonifyEventName, ButtonifyListener]> = [
        ["pointerup", pointerUp],
        ["pointerdown", pointerDown],
    ];
    if(_settings.trackMovementOutsideElement) {
        listeners.push(["pointerupoutside", pointerUp]);
    }
    if(pointerMove) {
        listeners.push(["pointermove", pointerMove]);
    }

    const targets = Array.isArray(_target) ? _target : [_target];
    return bindTargets(targets, listeners, _settings.disableButtonMode);
}

function buttonify_desktop<T extends Container>(
    _target: T | T[],
    _settings: {
        disableButtonMode?: boolean;
        trackMovementOutsideElement?: boolean;

        onFire: (ev: PIXIInteractionEvent, _state: IButtonifyState) => void;

        onPointerUp?: (ev: PIXIInteractionEvent, _state: IButtonifyState) => void;
        onPointerDown?: (ev: PIXIInteractionEvent, _state: IButtonifyState) => void;
        onPointerOver?: (ev: PIXIInteractionEvent, _state: IButtonifyState) => void;
        onPointerOut?: (ev: PIXIInteractionEvent, _state: IButtonifyState) => void;
        onPointerMove?: (ev: PIXIInteractionEvent, _state: IButtonifyState) => void;
    }
): () => void {
    const state: IButtonifyState = {
        pointerOver: false,
        pointerDown: false,
    };
    let pointerMove = null;
    if(_settings.onPointerMove) {
        pointerMove = (ev: PIXIInteractionEvent) => {
            if(
                !state.pointerOver &&
                !_settings.trackMovementOutsideElement
            ) return;
            _settings.onPointerMove(ev, state);
        };
    }
    const pointerUp = (ev: PIXIInteractionEvent) => {
        if(_settings.onPointerUp)
            _settings.onPointerUp(ev, state);
        if(state.pointerDown && state.pointerOver) {
            _settings.onFire(ev, state);
        }
        state.pointerDown = false;
    };
    const pointerOver = (ev: PIXIInteractionEvent) => {
        if(_settings.onPointerOver)
            _settings.onPointerOver(ev, state);
        state.pointerOver = true;
    };
    const pointerOut = (ev: PIXIInteractionEvent) => {
        if(_settings.onPointerOut)
            _settings.onPointerOut(ev, state);
        state.pointerOver = false;
        state.pointerDown = false;
    };
    const pointerDown = (ev: PIXIInteractionEvent) => {
        if(_settings.onPointerDown)
            _settings.onPointerDown(ev, state);
        state.pointerDown = true;
    };

    const listeners: Array<[ButtonifyEventName, ButtonifyListener]> = [
        ["pointerup", pointerUp],
        ["pointerover", pointerOver],
        ["pointerout", pointerOut],
        ["pointerdown", pointerDown],
    ];
    if(_settings.trackMovementOutsideElement) {
        listeners.push(["pointerupoutside", pointerUp]);
    }
    if(pointerMove) {
        listeners.push(["pointermove", pointerMove]);
    }

    const targets = Array.isArray(_target) ? _target : [_target];
    return bindTargets(targets, listeners, _settings.disableButtonMode);
}

/**
 * Makes the target(s) clickable/tappable; `onFire` runs on a completed click or tap.
 * Calling it again on the same target replaces that target's previous binding rather than adding to it.
 * @returns A function that removes the listeners added by this call (and restores the cursor).
 *  It does nothing for targets that have since been re-buttonified, and is safe to call more than once.
 */
export function buttonify<T extends Container>(
    _target: T | T[],
    _settings: {
        disableButtonMode?: boolean;
        trackMovementOutsideElement?: boolean;

        onFire: (ev: PIXIInteractionEvent, _state: IButtonifyState) => void;

        onPointerUp?: (ev: PIXIInteractionEvent, _state: IButtonifyState) => void;
        onPointerDown?: (ev: PIXIInteractionEvent, _state: IButtonifyState) => void;
        onPointerOver?: (ev: PIXIInteractionEvent, _state: IButtonifyState) => void;
        onPointerOut?: (ev: PIXIInteractionEvent, _state: IButtonifyState) => void;
        onPointerMove?: (ev: PIXIInteractionEvent, _state: IButtonifyState) => void;
    }
): () => void {
    if((!isMobile() && !isTouchDevice())) {
        return buttonify_desktop(_target, _settings);
    } else {
        return buttonify_mobile(_target, _settings);
    }
}