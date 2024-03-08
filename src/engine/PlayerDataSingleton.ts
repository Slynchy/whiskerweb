// import { SAVE_KEYS } from "./Constants/SaveKeys";
import { ENGINE_DEBUG_MODE } from "./Constants/Constants";
import {IData} from "./Types/IData";

type TSaveKey = string;

class PlayerDataSingletonClass {

    // Properties
    private _initialized: boolean = false;
    private _keys: TSaveKey[] = [];
    private _data: IData = {};
    private _dirty: Array<TSaveKey> = [];

    constructor() {}

    public isInitialized(): boolean {
        return this._initialized;
    }

    public dirtify(key: (string | TSaveKey) | (string[] | TSaveKey[])): void {
        if(Array.isArray(key)) {
            this._dirty.push(...(key as TSaveKey[]));
        } else {
            this._dirty.push(key as TSaveKey);
        }
    }

    public isDirty(): boolean {
        return this._dirty.length > 0;
    }

    public setData<T>(_key: TSaveKey, _value: T): void {
        if (this._keys.indexOf(_key) === -1) {
            console.error(`Key ${_key} not found in PlayerDataSingleton`);
            return;
        }
        if(this._data[_key] !== _value) {
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
        const data = _data || {} as Record<string, unknown>;
        if (this.isInitialized()) {
            console.warn("PlayerDataSingleton being initialized multiple times");
        }
        this._data = data || {};
        this._keys = _keys;

        this._initialized = true;
    }

    public export(_exportAll: boolean = false): { [key: string]: unknown } {
        const retVal: { [key: string]: unknown } = {};

        Object.keys(this._data).forEach((_key) => {
            if(this._dirty.indexOf(_key) !== -1 || _exportAll) {
                retVal[_key] = this._data[_key];
            }
        });
        this._dirty = [];

        return retVal;
    }

    public resetAllData(): void {
        // HACK
        try {
            window.localStorage.clear();
        } catch(err) {
            console.error(err);
        }
        // HACK

        PlayerDataSingleton = new PlayerDataSingletonClass();
    }
}

export let PlayerDataSingleton = new PlayerDataSingletonClass();

if(ENGINE_DEBUG_MODE) {
    // @ts-ignore
    window["PlayerDataSingleton"] = PlayerDataSingleton;
}
