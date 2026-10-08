import { Saver } from "./Saver";
import { IData } from "../Types/IData";
import { ENGINE_DEBUG_MODE } from "../Constants/Constants";

/**
 * Saves each key as JSON in localStorage, under `prefix + key`.
 */
export class LocalStorageSaver extends Saver {

    protected _dataCache: Record<string, unknown> = {};
    private readonly _prefix: string;
    // Keys this saver has loaded or saved; clear() removes only these
    private readonly _knownKeys: Set<string> = new Set();

    /**
     * @param _prefix Prepended to every localStorage key, so games on the same origin don't collide
     */
    constructor(_prefix: string = "") {
        super();
        this._prefix = _prefix;
    }

    clear(): Promise<void> {
        // localStorage is shared by everything on the origin, so only remove our own keys
        this._knownKeys.forEach((key) => {
            try {
                window.localStorage.removeItem(this._prefix + key);
            } catch (err) {
                console.error(err);
            }
        });
        return Promise.resolve(undefined);
    }

    load(_keysToLoad: string[] = []): Promise<IData> {
        const obj: { [key: string]: unknown } = {};
        for (const key of _keysToLoad) {
            this._knownKeys.add(key);
            try {
                const raw = window.localStorage.getItem(this._prefix + key);
                obj[key] = raw === null ? null : LocalStorageSaver.parse(raw);
            } catch(err) {
                if(ENGINE_DEBUG_MODE) {
                    console.error(err);
                }
            }
        }
        return Promise.resolve(obj);
    }

    save(data: Partial<IData>): Promise<void> {
        const errors: unknown[] = [];
        for (const key of Object.keys(data)) {
            this._knownKeys.add(key);
            try {
                if (data[key] === undefined) {
                    window.localStorage.removeItem(this._prefix + key);
                } else {
                    window.localStorage.setItem(this._prefix + key, JSON.stringify(data[key]));
                }
                if (ENGINE_DEBUG_MODE) {
                    console.log(`[LocalStorageSaver] Saved key %o with data %o`, key, data[key]);
                }
            } catch (err) {
                errors.push(err);
            }
        }
        return errors.length > 0 ? Promise.reject(errors[0]) : Promise.resolve();
    }

    /**
     * Values are saved as JSON. Older saves stored strings, numbers and booleans as raw text,
     * so anything that isn't valid JSON comes back as the raw string.
     */
    private static parse(_raw: string): unknown {
        try {
            return JSON.parse(_raw);
        } catch {
            return _raw;
        }
    }
}
