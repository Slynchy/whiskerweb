import { LOADTIME_DEBUG_MODE } from "../Constants/Constants";

interface ILoadtimeLog {
    timeSinceLast: number;
    timeSinceFirst: number;
    timestamp: number;
    name: string;
}

export class LoadtimeMeasurer {
    private _logs: ILoadtimeLog[] = [];

    constructor() {
    }

    public recordLoadtime(_name?: string): void {
        if(_name && this._logs.find((e) => e.name === _name)) {
            if(LOADTIME_DEBUG_MODE) console.warn("Cannot log key %s, already logged", _name);
            return;
        }
        const now = Date.now();
        this._logs.push({
            timeSinceLast: (this._logs.length > 1 ? now - this._logs[this._logs.length - 1].timestamp : 0),
            timestamp: now,
            timeSinceFirst: now - (this._logs[0] || {timestamp: now}).timestamp,
            name: _name || this._logs.length.toString()
        });
    }

    public exportLoadtime(): string {
        let res = `Loadtimes:\n`;
        for (let i = 0; i < this._logs.length; i++) {
            res = res + `${this._logs[i].name}: ${this._logs[i].timeSinceFirst},\n`;
        }
        return res;
    }
}
