import { ILoaderReturnValue, Loader } from "./Loader";
import { ENGINE_DEBUG_MODE } from "../Constants/Constants";

export class JSONLoader extends Loader<object> {
    private readonly _cache: { [key: string]: object } = {};

    private _queue: {key: string, path: string}[] = [];

    add(_key: string, _asset: string): void {
        this._queue.push({
            key: _key,
            path: _asset
        });
    }

    public has(_key: string): boolean {
        return Boolean(this._cache[_key]);
    }

    cache<T>(_key: string, _asset: T): void {
        if(ENGINE_DEBUG_MODE) {
            console.log("Caching %s as %o", _key, _asset);
        }
        this._cache[_key] = _asset as unknown as object;
    }

    get<T>(_key: string): T {
        return this._cache[_key] as unknown as T;
    }

    isAssetLoaded(_key: string): boolean {
        return Boolean(this._cache[_key]);
    }

    async load(_onProgress?: ((progress: number) => void) | undefined): Promise<
        ILoaderReturnValue
    > {
        const queue = this._queue;
        this._queue = [];
        if(queue.length === 0) {
            _onProgress?.(100);
            return {};
        }

        return this.trackLoading(async () => {
            const result: ILoaderReturnValue = {};
            let counter = 0;
            _onProgress?.(0);

            const fetchJSON = async (path: string): Promise<object> => {
                const resp = await fetch(path);
                if (!resp.ok) {
                    throw new Error(`HTTP ${resp.status} loading ${path}`);
                }
                return await resp.json();
            };

            await Promise.all(queue.map(async (e) => {
                try {
                    let data: object;
                    try {
                        data = await fetchJSON(e.path);
                    } catch {
                        // One retry
                        data = await fetchJSON(e.path);
                    }
                    this.cache(e.key, data);
                    result[e.key] = { success: true };
                } catch (err) {
                    result[e.key] = { success: false, error: err as Error };
                }
                counter++;
                _onProgress?.((counter / queue.length) * 100);
            }));

            if(Object.keys(result).some((k) => !result[k].success)) {
                console.error(`Error encountered when loading JSON; full results: %o`, result);
            }
            return result;
        });
    }

    unload(_key: string): void {
        if(!this.isAssetLoaded(_key)) {
            console.warn("Can't unload %s, not loaded", _key);
            return;
        }
        delete this._cache[_key];
    }

}
