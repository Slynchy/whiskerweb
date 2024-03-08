import {Container, FederatedEvent as PIXIInteractionEvent} from "pixi.js";
import {HelperFunctions} from "../HelperFunctions";
import isMobile from "is-mobile";
import {isTouchDevice} from "./isTouchDevice";

interface IButtonifyState {
    pointerOver: boolean;
    pointerDown: boolean;
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
): void {
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

    const targets = Array.isArray(_target) ? _target : [_target];
    for( let i = 0; i < targets.length; i++) {
        const target = targets[i];
        HelperFunctions.makeInteractive(target, _settings.disableButtonMode);
        target.on("pointerup", pointerUp);
        target.on("pointerdown", pointerDown);
        if(_settings.trackMovementOutsideElement) {
            target.on("pointerupoutside", pointerUp);
        }
        if(pointerMove) {
            target.on("pointermove", pointerMove);
        }
    }

    return;
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
): void {
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

    const targets = Array.isArray(_target) ? _target : [_target];
    for( let i = 0; i < targets.length; i++) {
        const target = targets[i];
        HelperFunctions.makeInteractive(target, _settings.disableButtonMode);
        target.on("pointerup", pointerUp);
        target.on("pointerover", pointerOver);
        target.on("pointerout", pointerOut);
        target.on("pointerdown", pointerDown);
        if(_settings.trackMovementOutsideElement) {
            target.on("pointerupoutside", pointerUp);
        }
        if(pointerMove) {
            target.on("pointermove", pointerMove);
        }
    }

    return;
}

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
): void {
    if((!isMobile() && !isTouchDevice())) {
        buttonify_desktop(_target, _settings);
    } else {
        buttonify_mobile(_target, _settings);
    }

    return;
}