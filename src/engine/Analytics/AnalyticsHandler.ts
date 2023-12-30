import { BaseAnalytics } from "./BaseAnalytics";
import { ANALYTICS_DEBUG_MODE, ENGINE_DEBUG_MODE } from "../Constants/Constants";

export class AnalyticsHandler {

    private readonly _enabled: boolean = true;
    private _initialized: boolean = false;

    private _analyticsReferences: BaseAnalytics[] = [];

    constructor(_analyticsModules: BaseAnalytics[]) {
        _analyticsModules.forEach((e) => this.addModule(e));
    }

    public initialize(): void {
        if(this._initialized) return;
        if(ENGINE_DEBUG_MODE)
            console.log("Initializing Analytics");
        this._analyticsReferences.forEach((e) => e.initialize());
        this._initialized = true;
        if(ENGINE_DEBUG_MODE)
            console.log("Initialized Analytics");
    }

    public addModule(analytic: BaseAnalytics): void {
        this._analyticsReferences.push(analytic);
    }

    public logEvent(...args: unknown[]): void {
        if (ANALYTICS_DEBUG_MODE) {
            if (this._analyticsReferences.length > 0) console.log("Logging event: %o", args);
        }
        if (!this._enabled) return;
        // eslint-disable-next-line prefer-spread
        this._analyticsReferences.forEach((e) => e.logEvent.apply(e, args));
    }
}
