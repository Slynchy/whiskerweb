import { GameObject } from "./GameObject";
import { System } from "./Systems/System";
import { ENGINE_DEBUG_MODE } from "./Constants/Constants";

export abstract class Component {

    /**
     * Every component currently attached to a GameObject.
     * Maintained by GameObject.addComponent / removeComponent.
     */
    public static instances: Array<Component> = [];
    public static readonly id: string = "component";
    protected _parent: GameObject;
    protected static readonly _system: typeof System;

    public static findInstances<T extends Component>(_searchFunc: (e: T) => boolean): T[] {
        return Component.instances.filter(_searchFunc) as T[];
    }

    public get parent(): GameObject {
        return this._parent;
    }

    public set parent(_parent: GameObject) {
        if(ENGINE_DEBUG_MODE) {
            console.log("Parenting %s to %o", (this.constructor as typeof Component).id, _parent);
        }
        this._parent = _parent;
    }

    public getSystem(): typeof System {
        const system = (this.constructor as typeof Component)._system;
        if (!system) {
            throw new Error(`Component "${(this.constructor as typeof Component).id}" has no static _system`);
        }
        return system;
    }

    /**
     * Called by `System.onDestroy` when the component is removed from its GameObject
     * (directly or because the GameObject was destroyed). Override for cleanup.
     */
    public onDestroy(): void {
    }

    public abstract onAttach(): void;

    public abstract onDetach(): void;

    /**
     * Called when a component is added to the parent
     */
    public abstract onComponentAttached(_componentId: string, _component: Component): void;
}
