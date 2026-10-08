import { ILoaderReturnValue, Loader } from "./Loader";
import { Assets, AssetsClass, Spritesheet, Texture } from "pixi.js";
import { ENGINE_DEBUG_MODE } from "../Constants/Constants";

export class PIXILoader extends Loader<Texture> {
  private loader: AssetsClass;
  private readonly _cache: { [key: string]: Texture };
  private _currentQueue: string[] = [];
  // Keys registered with PIXI Assets (as opposed to spritesheet frames or manually cached assets)
  private readonly _aliases: Set<string> = new Set();

  private _initPromise: Promise<void>;
  private _initialized: boolean = false;

  constructor() {
    super();
    this.loader = Assets;
    this._initPromise = this.loader
      .init({
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
    if (!this._aliases.has(_key)) {
      this.loader.add({
        alias: _key,
        src: _asset,
      });
      this._aliases.add(_key);
    }
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
    return this._cache[_key] || null;
  }

  /**
   * Removes the asset from the cache. Assets loaded with `add`/`load` are also unloaded from PIXI Assets,
   * which destroys their textures (and drops a spritesheet's frames from the cache).
   */
  public unload(_key: string): void {
    const asset: unknown = this._cache[_key];
    delete this._cache[_key];
    if (!this._aliases.has(_key)) return;

    if (asset instanceof Spritesheet) {
      Object.keys(asset.textures).forEach((frameKey) => {
        if (this._cache[frameKey] === asset.textures[frameKey]) {
          delete this._cache[frameKey];
        }
      });
    }
    if (asset) {
      this.loader.unload(_key).catch((err) => console.error(err));
    }
  }

  async load(
    _onProgress?: (progress: number) => void,
  ): Promise<ILoaderReturnValue> {
    // Take the queue now, so a failed asset isn't retried by every later load
    const keys = this._currentQueue;
    this._currentQueue = [];
    if (keys.length === 0) {
      _onProgress?.(100);
      return {};
    }

    return this.trackLoading(async () => {
      const errors: { [key: string]: Error } = {};
      const onError = (err: Error, asset: unknown): void => {
        const alias = (asset as { alias?: string[] })?.alias?.[0];
        if (alias) errors[alias] = err;
      };

      let loaded: Record<string, unknown> = await this.loader.load(keys, {
        onProgress: (p: number) => _onProgress?.(p * 100),
        onError,
        strategy: "skip",
      });
      const failed = keys.filter((e) => !loaded[e]);
      if (failed.length > 0) {
        // One retry for anything that failed
        const retried = await this.loader.load(failed, { onError, strategy: "skip" });
        loaded = { ...loaded, ...retried };
      }

      const res: ILoaderReturnValue = {};
      keys.forEach((e) => {
        res[e] = {
          success: Boolean(loaded[e]),
        };
        if (res[e].success) {
          this.cache(e, loaded[e]);
          if (loaded[e] instanceof Spritesheet) {
            const sheet = loaded[e] as Spritesheet;
            Object.keys(sheet.textures).forEach((texKey) => {
              const tex = sheet.textures[texKey];
              this.cache(texKey, tex);
            });
          }
        } else {
          res[e].error = errors[e] || new Error(`Failed to load ${e}`);
        }
      });
      return res;
    });
  }

  public cache<T>(_key: string, _asset: T): void {
    if (ENGINE_DEBUG_MODE) {
      console.log("Cached PIXI asset %s (%o)", _key, _asset);
    }
    // @ts-ignore
    this._cache[_key] = _asset;
  }

  public isAssetLoaded(_key: string): boolean {
    return Boolean(this._cache[_key]);
  }
}
