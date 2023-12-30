import { ILoaderReturnValue, Loader } from "./Loader";
import {Assets, AssetsClass, Texture} from "pixi.js";
import { HelperFunctions } from "../HelperFunctions";
import { ENGINE_DEBUG_MODE } from "../Constants/Constants";

export class PIXILoader extends Loader<Texture> {

    private loader: AssetsClass;
    private readonly _cache: { [key: string]: Texture };
    private _currentQueue: string[] = [];

    private _initPromise: Promise<void>;
    private _initialized: boolean = false;

    constructor() {
        super();
        this.loader = Assets;
        this._initPromise = this.loader.init({
            // todo: Implement loader settings here
        })
            .then(() => {
                this._initialized = true;
            });
        this._cache = {};
    }

    public has(_key: string): boolean {
        return Boolean(this._cache[_key]);
    }

    public add(_key: string, _asset: string): void {
        this.loader.add(
            {
                alias: _key,
                src: _asset
            }
        );
        this._currentQueue.push(_key);
    }

    // public addPreprocessFunction(
    //     func: ILoaderMiddleware
    // ): void {
    //     this.loader.pre(func);
    // }

    public get<T>(_key: string): T {
        // fixme
        // @ts-ignore
        return (this._cache[_key] || null);
    }

    public unload(_key: string): void {
        if (this._cache[_key])
            this._cache[_key] = undefined;
    }

    async load(
        _onProgress?: (progress: number) => void
    ): Promise<ILoaderReturnValue> {
        return this.loader.load(this._currentQueue)
            .then((t) => {
                const res: ILoaderReturnValue = {};
                this._currentQueue.forEach((e) => {
                    res[e] = {
                        success: Boolean(t[e]),
                    };
                    if(res[e].success) {
                        this.cache(e, t[e]);
                    }
                });
                this._currentQueue = [];
                return res;
            });
    }

    public cache<T>(_key: string, _asset: T): void {
        if (ENGINE_DEBUG_MODE) {
            console.log("Cached PIXI asset " + _key);
        }
        // @ts-ignore
        this._cache[_key] = _asset;
    }

    public isAssetLoaded(_key: string): boolean {
        return Boolean(this._cache[_key]);
    }
}
