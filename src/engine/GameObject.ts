import { Component } from "./Component";
import { InteractionEvent } from "./Types/InteractionEvent";
import { HelperFunctions } from "./HelperFunctions";
import { Container, DestroyOptions } from "pixi.js";
import { IVector2 } from "./Types/IVector2";

// tslint:disable-next-line:no-any
type BasicClass = new (...args: any) => any;

/**
 * Set to true to see console logs when objects change state
 */
const LOG_ACTIVITY_CHANGE = false;

export class GameObject extends Container {

    public label: string = "GameObject";
    protected _active: boolean = true;
    private components: Component[] = [];
    private _onDestroy: { [key: string]: Function; } = {};
    private _queuedForDestruction: boolean = false;
    private _onAddComponent: { [key: string]: Function; } = {};
    private _onRemoveComponent: { [key: string]: Function; } = {};

    constructor(label?: string, components?: Component[]) {
        super();
        if (label)
            this.label = label;
        if (components) {
            components.forEach((e) => this.addComponent(e));
        }
    }

    /**
     * Gets, or with `_val` sets, whether this object's components are stepped.
     * Changing it calls each component's `System.onEnable` / `System.onDisable`.
     * @param _val
     * @param _recursive Also apply to child GameObjects
     */
    public isActive(_val?: boolean, _recursive?: boolean): boolean {
        if(typeof _val === "boolean") {
            if(_val !== this._active) {
                if(LOG_ACTIVITY_CHANGE) {
                    console.log(`Setting %s to ${_val ? "active" : "inactive"}`, this.label);
                }
                this._active = _val;
                for (const comp of [...this.components]) {
                    if (_val) {
                        comp.getSystem().onEnable(comp);
                    } else {
                        comp.getSystem().onDisable(comp);
                    }
                }
            }
            if(_recursive) {
                this.children.forEach((e) => (e as GameObject).isActive?.(_val, _recursive));
            }
        }
        return this._active;
    }

    public getComponents(): Component[] {
        return [...this.components];
    }

    /**
     * Moves the object along its own (rotated) axes
     */
    public translate(x: number | IVector2, y: number = 0): void {
        const dx = typeof x === "number" ? x : x.x;
        const dy = typeof x === "number" ? y : x.y;
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        this.x += dx * cos - dy * sin;
        this.y += dx * sin + dy * cos;
    }

    public addComponent(_component: Component): void {
        if (this.hasComponent(_component)) {
            throw new Error("Cannot have multiple of the same component on a single GameObject!");
        }
        const system = _component.getSystem();
        this.components.push(_component);
        Component.instances.push(_component);
        _component.parent = this;
        system.onAwake(_component);
        _component.onAttach();
        for (let i = 0; i < this.components.length - 1; i++) {
            this.components[i].onComponentAttached(
                (_component.constructor as typeof Component).id,
                _component
            );
        }
        this.fireEvent("_onAddComponent", _component);
    }

    /**
     * Removes a component (by instance or by class), calling its `onDetach` and then its `System.onDestroy`
     */
    public removeComponent<T extends BasicClass>(_component: T | Component): void {
        const index = this.components.findIndex(
            (c) => c === _component || c.constructor === _component
        );
        if (index === -1) {
            if (_component instanceof Component) return;
            throw new Error("Could not remove component from GameObject; doesn't exist!");
        }

        const comp = this.components.splice(index, 1)[0];
        const instanceIndex = Component.instances.indexOf(comp);
        if (instanceIndex !== -1) Component.instances.splice(instanceIndex, 1);
        comp.onDetach();
        comp.getSystem().destroy(comp);
        this.fireEvent("_onRemoveComponent", comp);
    }

    public removeAllComponents(): void {
        for (const comp of [...this.components]) {
            this.removeComponent(comp);
        }
    }

    public onAddComponent(): InteractionEvent<Function> {
        return HelperFunctions.createInteractionEvent(this, "_onAddComponent");
    }

    public onRemoveComponent(): InteractionEvent<Function> {
        return HelperFunctions.createInteractionEvent(this, "_onRemoveComponent");
    }

    public isQueuedForDestruction(): boolean {
        return this._queuedForDestruction;
    }

    public onDestroy(): InteractionEvent<Function> {
        return HelperFunctions.createInteractionEvent(this, "_onDestroy");
    }

    public hasComponent<T extends BasicClass>(_component: T | Component): boolean {
        const id = _component instanceof Component
            ? (_component.constructor as typeof Component).id
            : (_component as unknown as typeof Component).id;
        return this.components.some((e) => (e.constructor as typeof Component).id === id);
    }

    public debug_GetListOfComponents(): string {
        let str = "[";
        for(let i = 0; i < this.components.length; i++) {
            str = `${str}${((this.components[i]).constructor as typeof Component).id},`;
        }
        return str + "]";
    }

    public getComponent<T extends BasicClass>(_component: T): InstanceType<T> | null {
        for (const c of this.components) {
            if (c.constructor === _component) return c as InstanceType<T>;
        }
        return null;
    }

    /**
     * Removes every component (see `removeComponent`), then destroys all children and the object itself.
     * Children are always destroyed, whatever `options.children` says.
     */
    public destroy(options?: DestroyOptions): void {
        if (this.destroyed) return;
        this._queuedForDestruction = true;
        const onDestroy = this._onDestroy;
        this._onDestroy = {};
        for (const onDestroyId in onDestroy) {
            if (
                Object.prototype.hasOwnProperty.call(onDestroy, onDestroyId) &&
                onDestroy[onDestroyId]
            ) {
                onDestroy[onDestroyId]();
            }
        }
        this.removeAllComponents();
        // `true` also destroys textures, so only pass it on if the caller asked for it
        const childOptions: DestroyOptions =
            typeof options === "object" ? { ...options, children: true } : options === true ? true : { children: true };
        for (const child of [...this.children]) {
            child.destroy(childOptions);
        }
        super.destroy(options);
    }

    public onStep(_dt: number): void {
        if(!this.isActive()) return;
        const components = this.components;
        for (let i = 0; i < components.length; i++) {
            const component = components[i];
            component.getSystem().onStep(_dt, component);
            // The component removed itself, so the next one is now at index i
            if (components[i] !== component) i--;
        }
    }

    // tslint:disable-next-line:no-any
    private fireEvent(key: string, ...params: any[]): void {
        // @ts-ignore
        for (const ev in (this[key]) as { [key: string]: Function; }) {
            // @ts-ignore
            if( this[key][ev] ) {
                // @ts-ignore
                this[key][ev](...params);
            }
        }
    }
}
