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

    initialize(_keys: string[], _data: IData): void {
        const data = _data || {} as Record<string, unknown>;
        if (this.isInitialized()) {
            console.warn("PlayerDataSingleton being initialized multiple times");
        }
        this._data = data;
        this._keys = _keys;

        this._initialized = true;
    }

    public export(_exportAll: boolean = false): { [key: string]: unknown } {
        const retVal: { [key: string]: unknown } = {};

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
