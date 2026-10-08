// this component logs (and optionally breaks on) every get/set of the named properties of its parent

import { System } from "../Systems/System";
import { Component } from "../Component";

export class DebugMonitorComponent extends Component {
    public static readonly id: string = "DebugMonitorComponent";
    protected static readonly _system:
        typeof System = System;

    // propnames
    public propNames: string[] = [];
    // last value written through the monitor (for plain data properties, this is where the value lives)
    public cachedProps: Record<string, any> = {};
    public fireDebugger: boolean = false;

    // the parent's own descriptor for each monitored prop, or undefined if it was inherited
    private _ownDescriptors: Record<string, PropertyDescriptor | undefined> = {};

    constructor(_propName: string | string[], _fireDebugger?: boolean) {
        super();

        if(Array.isArray(_propName)) {
            this.propNames.push(..._propName);
        } else {
            this.propNames.push(_propName);
        }

        this.fireDebugger = _fireDebugger || false;
    }

    private static findDescriptor(_obj: object, _prop: string): PropertyDescriptor | undefined {
        for (let proto = _obj; proto; proto = Object.getPrototypeOf(proto)) {
            const descriptor = Object.getOwnPropertyDescriptor(proto, _prop);
            if (descriptor) return descriptor;
        }
        return undefined;
    }

    onAttach(): void {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        this.propNames.forEach((e: string) => {
            if (e in this._ownDescriptors) return; // already monitored
            const ownDescriptor = Object.getOwnPropertyDescriptor(this.parent, e);
            if (ownDescriptor && !ownDescriptor.configurable) {
                console.warn(`[DebugMonitorComponent] cannot monitor non-configurable property "${e}"`);
                return;
            }
            const original = DebugMonitorComponent.findDescriptor(this.parent, e);
            const isAccessor = Boolean(original && (original.get || original.set));
            if (!isAccessor) this.cachedProps[e] = original?.value;
            this._ownDescriptors[e] = ownDescriptor;

            // reading `label` from inside the `label` monitor would recurse
            const labelOf = (obj: any): string => e === "label" ? "(monitored label)" : obj.label;

            Object.defineProperty(
                this.parent,
                e,
                {
                    configurable: true,
                    enumerable: original ? original.enumerable : true,
                    get() {
                        console.warn(`[DebugMonitorComponent] "${
                            labelOf(this)
                        }" is firing 'get' for property "${e}"`);
                        // eslint-disable-next-line no-debugger
                        if(self.fireDebugger) debugger;
                        return isAccessor ? original.get?.call(this) : self.cachedProps[e];
                    },
                    set(v: unknown) {
                        console.warn(`[DebugMonitorComponent] "${
                            labelOf(this)
                        }" is firing 'set' for property "${e}"`);
                        // eslint-disable-next-line no-debugger
                        if(self.fireDebugger) debugger;
                        self.cachedProps[e] = v;
                        if (isAccessor) original.set?.call(this, v);
                    },
                }
            );
        });
    }

    onComponentAttached(_componentId: string, _component: Component): void {
    }

    onDetach(): void {
        this.propNames.forEach((e: string) => {
            if (!(e in this._ownDescriptors)) return; // never monitored
            const ownDescriptor = this._ownDescriptors[e];
            delete this._ownDescriptors[e];
            // removing our own property re-exposes the inherited accessor/value
            delete (this.parent as any)[e];
            if (ownDescriptor) {
                // it was the parent's own property; put it back, keeping any value written meanwhile
                Object.defineProperty(
                    this.parent,
                    e,
                    ("value" in ownDescriptor) ? {...ownDescriptor, value: this.cachedProps[e]} : ownDescriptor
                );
            }
        });
    }

}
