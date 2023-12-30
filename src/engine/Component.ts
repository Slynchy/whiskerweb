import { GameObject } from "./GameObject";
import { System } from "./Systems/System";
import { ENGINE_DEBUG_MODE } from "./Constants/Constants";

export abstract class Component {

    public static instances: Array<Component> = [];
    public static readonly id: string = "component";
    protected _parent: GameObject;
    protected static readonly _system: typeof System;

    constructor() {
        Component.instances.push(this);
    }

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
        return (this.constructor as typeof Component)._system;
    }

    public onDestroy(): void {
        const ind = Component.instances.indexOf(this, 0);
        if(ind === -1) {
            throw new Error("Component exists without an instance!");
        }
        Component.instances.splice(ind, 1);
    }

    public abstract onAttach(): void;

    public abstract onDetach(): void;

    /**
     * Called when a component is added to the parent
     */
    public abstract onComponentAttached(_componentId: string, _component: Component): void;
}
