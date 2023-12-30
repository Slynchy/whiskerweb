// this component sets activity for the parent based on visibility

import { System } from "../Systems/System";
import { Component } from "../Component";

export class DebugMonitorComponent extends Component {
    public static readonly id: string = "DebugMonitorComponent";
    protected static readonly _system:
        typeof System = System;

    // propnames
    public propNames: string[] = [];
    public cachedProps: Record<string, any> = {};
    public fireDebugger: boolean = false;

    constructor(_propName: string | string[], _fireDebugger?: boolean) {
        super();

        if(Array.isArray(_propName)) {
            this.propNames.push(..._propName);
        } else {
            this.propNames.push(_propName);
        }

        this.fireDebugger = _fireDebugger || false;
    }

    onAttach(): void {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        this.propNames.forEach((e: string) => {
            this.cachedProps[e]
                // @ts-ignore
                = this.parent[e];

            Object.defineProperty(
                this.parent,
                e,
                {
                    get() {
                        console.warn(`[DebugMonitorComponent] "${
                            this.name
                        }" is firing 'get' for property "${e}"`);
                        // eslint-disable-next-line no-debugger
                        if(self.fireDebugger) debugger;
                        return self.cachedProps[e];
                    },
                    set(v: unknown) {
                        console.warn(`[DebugMonitorComponent] "${
                            this.name
                        }" is firing 'set' for property "${e}"`);
                        // eslint-disable-next-line no-debugger
                        if(self.fireDebugger) debugger;
                        self.cachedProps[e] = v;
                    },
                }
            );
        });
    }

    onComponentAttached(_componentId: string, _component: Component): void {
    }

    onDetach(): void {
        this.propNames.forEach((e: string) => {
            Object.defineProperty(
                this.parent,
                e,
                this.cachedProps[e]
            );
        });
    }

}
