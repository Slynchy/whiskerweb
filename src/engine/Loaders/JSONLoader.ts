import { ILoaderReturnValue, Loader } from "./Loader";
import { ENGINE_DEBUG_MODE } from "../Constants/Constants";

export class JSONLoader extends Loader<object> {
    private readonly _cache: { [key: string]: object } = {};

    // yes
    private _queueQueue: {key: string, path: string}[] = [];

    private _currentQueue: {key: string, path: string}[] = [];

    add(_key: string, _asset: string): void {
        this._queueQueue.push({
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
        if(this._currentQueue.length > 0) {
            await new Promise<void>((res, rej) => {
                let interval = setInterval(() => {
                    if(this._currentQueue.length === 0) {
                        clearInterval(interval);
                        res();
                    }
                }, 333);
            });
        }

        if(this._queueQueue.length === 0) {
            _onProgress ? _onProgress(100) : null;
            return Promise.resolve({});
        }

        this._currentQueue = this._queueQueue;
        this._queueQueue = [];

        const results: Array<{
            key: string;
            success: boolean;
            result: object;
            error?: Error;
        }> = this._currentQueue.map((e) => {
            return {
                key: e.key,
                success: false,
                result: null,
            };
        });

        let counter = 0;
        const len = this._currentQueue.length;
        _onProgress ? _onProgress(0) : null;
        await Promise.allSettled(
            this._currentQueue.map((e, i) => {
                return new Promise<void>((res, rej) => {
                    results[i].key = e.key;
                    fetch(e.path)
                        .catch((err) => (results[i].success = false, results[i].error = err))
                        .then((resp) => {
                            if(resp && resp.ok) {
                                return resp.json() as object;
                            }
                        })
                        .then((o) => {
                            if(o) {
                                results[i].result = o;
                                this.cache(results[i].key, results[i].result);
                                results[i].success = true;
                            }
                            counter++;
                            _onProgress ? _onProgress((counter / len) * 100) : null;
                            res();
                        });
                });
            })
        );
        if(results.find((r) => Boolean(r.error || !r.success))) {
            console.error(`Error encountered when loading JSON; full results: %o`, results);
        }

        const result: ILoaderReturnValue = {};
        results.forEach((r) => {
            result[r.key] = {
                success: r.success,
                error: r.error,
            };
        });

        this._currentQueue = [];

        return result;
    }

    unload(_key: string): void {
        if(!this.isAssetLoaded(_key)) {
            console.warn("Can't unload %s, not loaded", _key);
            return;
        }
        delete this._cache[_key];
    }

}