import { Component } from "./Component";
import { InteractionEvent } from "./Types/InteractionEvent";
import { HelperFunctions } from "./HelperFunctions";
import { Container, Renderer } from "pixi.js";
import { IVector2 } from "./Types/IVector2";

// tslint:disable-next-line:no-any
type BasicClass = new (...args: any) => any;

/**
 * Set to true to see console logs when objects change state
 */
const LOG_ACTIVITY_CHANGE = false;

export class GameObject extends Container {

    public name: string = "GameObject";
    protected _active: boolean = true;
    private components: Component[] = [];
    private _onDestroy: { [key: string]: Function; } = {};
    private _queuedForDestruction: boolean = false;
    private _onAddComponent: { [key: string]: Function; } = {};
    private _onRemoveComponent: { [key: string]: Function; } = {};

    constructor(name?: string, components?: Component[]) {
        super();
        if (name)
            this.name = name;
        if (components) {
            components.forEach((e) => this.addComponent(e));
        }
    }

    public isActive(_val?: boolean, _recursive?: boolean): boolean {
        if(typeof _val === "boolean") {
            if(LOG_ACTIVITY_CHANGE) {
                if(_val !== this._active) {
                    console.log(`Setting %s to ${_val ? "active" : "inactive"}`, this.name);
                }
            }
            if(_recursive) {
                this.children.forEach((e: GameObject) => e.isActive ? e.isActive(_val, _recursive) : null);
            }
            return this._active = _val;
        } else {
            return this._active;
        }
    }

    public getComponents(): Component[] {
        return [...this.components];
    }

    public translate(x: number | IVector2, y: number): void {
        if (typeof x === "number") {
            this.x = (this.x + x * Math.cos(this.rotation));
            this.y = (this.y + y * Math.sin(this.rotation));
        } else {
            this.x = (this.x + x.x * Math.cos(this.rotation));
            this.y = (this.y + x.y * Math.sin(this.rotation));
        }
    }

    public addComponent(_component: Component): void {
        if (this.hasComponent(_component)) {
            throw new Error("Cannot have multiple of the same component on a single GameObject!");
        }
        this.components.push(_component);
        this.components[this.components.length - 1].parent = (this);
        _component.getSystem().onAwake(_component);
        _component.onAttach();
        for (let i = 0; i < this.components.length - 1; i++) {
            this.components[i].onComponentAttached(
                (_component.constructor as typeof Component).id,
                _component
            );
        }
        this.fireEvent("_onAddComponent", _component);
    }

    public removeComponent<T extends BasicClass>(_component: T | Component): void {
        if (!(_component instanceof Component) && !this.hasComponent(_component)) {
            throw new Error("Could not remove component from GameObject; doesn't exist!");
        }

        for (const c in this.components) {
            if (this.components[c] === _component || this.components[c].constructor === _component) {
                this.components[c].onDetach();
                this.fireEvent(
                    "_onRemoveComponent",
                    this.components.splice(Number(c), 1)[0]
                );
                return;
            }
        }
    }

    public removeAllComponents(): void {
        for (const c in this.components) {
            this.removeComponent(this.components[c]);
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
        if(_component instanceof Component) {
            return Boolean(this.components.find((e) => {
                return (e.constructor as typeof Component).id === (_component as unknown as typeof Component).id;
            }));
        } else {
            return Boolean(this.components.find((e) => {
                return (e.constructor as typeof Component).id === (_component as unknown as typeof Component).id;
            }));
        }
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

    public destroy(options?: any): void {
        this._queuedForDestruction = true;
        for (const onDestroyId in this._onDestroy) {
            if (
                Object.prototype.hasOwnProperty.call(this._onDestroy, onDestroyId)
            ) {
                this._onDestroy[onDestroyId]();
            }
        }
        this._onDestroy = null;
        for (const comp of this.components) {
            comp.getSystem().destroy(comp);
        }
        this.removeAllComponents();
        this.components.length = 0;
        this.children.forEach((e) => {
            if (e.destroy)
                e.destroy(options);
        });
        super.destroy(options);
    }

    public onStep(_dt: number): void {
        if(!this.isActive()) return;
        for (const component of this.components) {
            component.getSystem().onStep(_dt, component);
        }
    }

    // tslint:disable-next-line:no-any
    private fireEvent(key: string, ...params: any[]): void {
        // @ts-ignore
        for (const ev in (this[key]) as { [key: string]: Function; }) {
            // @ts-ignore
            if( this[key][ev] ) {
                // @ts-ignore
                this[key][ev](params);
            }
        }
    }
}
