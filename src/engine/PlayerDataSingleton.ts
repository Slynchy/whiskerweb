// import { SAVE_KEYS } from "./Constants/SaveKeys";
import { ENGINE_DEBUG_MODE } from "./Constants/Constants";
import {IData} from "./Types/IData";

type TSaveKey = string;

class PlayerDataSingletonClass {

    // Properties
    private _initialized: boolean = false;
    private _keys: TSaveKey[] = [];
    private _data: IData = {};
    private _dirty: Set<TSaveKey> = new Set();

    constructor() {}

    public isInitialized(): boolean {
        return this._initialized;
    }

    public dirtify(key: (string | TSaveKey) | (string[] | TSaveKey[])): void {
        if(Array.isArray(key)) {
            key.forEach((k) => this._dirty.add(k));
        } else {
            this._dirty.add(key);
        }
    }

    public isDirty(): boolean {
        return this._dirty.size > 0;
    }

    public setData<T>(_key: TSaveKey, _value: T): void {
        if (this._keys.indexOf(_key) === -1) {
            console.error(`Key ${_key} not found in PlayerDataSingleton`);
            return;
        }
        // Objects and arrays are always marked dirty, since they may have been changed in place
        if(this._data[_key] !== _value || (typeof _value === "object" && _value !== null)) {
            this.dirtify(_key);
        }
        this._data[_key] = _value;
    }

    public getData<T>(_key: TSaveKey): T {
        if (this._keys.indexOf(_key) === -1) {
            console.error(`Key ${_key} not found in PlayerDataSingleton`);
            return undefined as unknown as T;
        }
        return this._data[_key] as T;
    }

    initialize(_keys: string[], _data?: IData): void {
        if (this.isInitialized()) {
            console.warn("PlayerDataSingleton being initialized multiple times");
        }
        this._data = { ...(_data || {}) };
        this._keys = _keys;
        this._dirty.clear();

        this._initialized = true;
    }

    /**
     * Returns the keys changed since the last export (or every key, with `_exportAll`), and marks them clean
     */
    public export(_exportAll: boolean = false): { [key: string]: unknown } {
        const retVal: { [key: string]: unknown } = {};

        Object.keys(this._data).forEach((_key) => {
            if(this._dirty.has(_key) || _exportAll) {
                retVal[_key] = this._data[_key];
            }
        });
        this._dirty.clear();

        return retVal;
    }

    /**
     * Resets every key to null and clears this game's keys from the savers.
     * Keys stay registered, so getData/setData keep working.
     */
    public resetAllData(): Promise<void> {
        this._data = {};
        this._keys.forEach((key) => this._data[key] = null);
        this._dirty.clear();

        const saveHandler = typeof ENGINE !== "undefined" ? ENGINE.getSaveHandler() : undefined;
        return saveHandler
            ? saveHandler.clear().then(() => undefined)
            : Promise.resolve();
    }
}

export const PlayerDataSingleton = new PlayerDataSingletonClass();

if(ENGINE_DEBUG_MODE) {
    // @ts-ignore
    window["PlayerDataSingleton"] = PlayerDataSingleton;
}
