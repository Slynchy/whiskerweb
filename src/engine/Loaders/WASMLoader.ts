import { ILoaderReturnValue, Loader } from "./Loader";

/**
 * Loads JavaScript modules (typically the JS glue that a WASM build ships with) with `import()`,
 * and caches the module namespace object.
 */
export class WASMLoader extends Loader<object> {

    private readonly _cache: {[key: string]: object} = {};
    private queue: { [key: string]: string } = {};

    public add(_key: string, _asset: string): void {
        this.queue[_key] = _asset;
    }

    public get<T>(_key: string): T {
        return (this._cache[_key] as unknown as T) || null;
    }

    unload(_key: string): void {
        delete this._cache[_key];
    }

    public has(_key: string): boolean {
        return Boolean(this._cache[_key]);
    }

    async load(
        _onProgress?: (progress: number) => void
    ): Promise<ILoaderReturnValue> {
        const entries = Object.entries(this.queue);
        this.queue = {};
        if(entries.length === 0) {
            _onProgress?.(100);
            return {};
        }

        return this.trackLoading(async () => {
            const returnValue: ILoaderReturnValue = {};
            let counter = 0;
            _onProgress?.(0);

            await Promise.all(entries.map(async ([key, path]) => {
                // Resolve against the page, as the old <script type="module"> approach did
                const url = new URL(path, document.baseURI).href;
                try {
                    let module: object;
                    try {
                        module = await import(/* webpackIgnore: true */ url);
                    } catch {
                        // One retry
                        module = await import(/* webpackIgnore: true */ url);
                    }
                    this.cache(key, module);
                    returnValue[key] = { success: true };
                } catch (err) {
                    console.error(err);
                    returnValue[key] = { success: false, error: err as Error };
                }
                counter++;
                _onProgress?.((counter / entries.length) * 100);
            }));

            return returnValue;
        });
    }

    cache<T>(_key: string, _asset: T): void {
        this._cache[_key] = _asset as unknown as object;
    }

    public isAssetLoaded(_key: string): boolean {
        return Boolean(this._cache[_key]);
    }

}
