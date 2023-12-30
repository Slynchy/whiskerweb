import { ILoaderReturnValue, Loader } from "./Loader";
import { HelperFunctions } from "../HelperFunctions";

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
        if (this._cache[_key])
            this._cache[_key] = undefined;
    }

    public has(_key: string): boolean {
        return Boolean(this._cache[_key]);
    }

    load(
        _onProgress?: (progress: number) => void
    ): Promise<ILoaderReturnValue> {
        const returnValue: ILoaderReturnValue = {};
        return new Promise<ILoaderReturnValue>( (resolve: Function, reject: Function): void => {
            const keys: string[]
                = Object.keys(this.queue).filter((key: string) => Object.hasOwnProperty.call(this.queue, key));
            // tslint:disable-next-line:no-any
            const promises: Array<Promise<any>> = [];

            if(keys.length === 0) {
                _onProgress ? _onProgress(100) : null;
                return resolve(null);
            }

            // tslint:disable-next-line:prefer-for-of
            for (let i: number = 0; i < keys.length; i++) {
                const currKey: string = keys[i];
                const currUrl: string = this.queue[currKey];
                returnValue[currKey] = {success: false};
                try {
                    const element = document.createElement("script");
                    element.type = "module";
                    element.innerHTML = `
import * as _wasmmodule from "${currUrl}";
let intervalKey = 0;
function addToCache() {
    ENGINE["wasmLoader"].cache(
        "${currKey}",
        _wasmmodule
    );
}
if(ENGINE) {
    addToCache()
} else {
    intervalKey = setInterval(() => {
        if(ENGINE) {
            clearInterval(intervalKey);
            addToCache();
        }
    })
}
`;
                    document.body.appendChild(element);
                    promises.push(
                        HelperFunctions.waitForTruth(() => {
                            return this.has(currKey);
                        })
                    );
                } catch(err) {
                    console.error(err);
                    returnValue[currKey].error = err;
                }
            }

            let counter = 0;
            const len = promises.length;
            _onProgress ? _onProgress(0) : null;
            promises.forEach((e) => {
                e.then((e) => {
                    ++counter;
                    _onProgress ? _onProgress((counter / len) * 100) : null;
                });
            });

            Promise.allSettled(promises)
                .then(() => {
                    // responses.forEach((e: object, i: number) => {
                    //     this._cache[keys[i]] = e;
                    //     returnValue[keys[i]].success = true;
                    // });
                    resolve();
                });

            // (function(){
            // return new Promise((_______resolve) => {
            // Module['onRuntimeInitialized'] = function() {
            //   _______resolve();
            // };
            // });})()
        });
    }

    cache<T>(_key: string, _asset: T): void {
        this._cache[_key] = _asset as unknown as object;
    }

    public isAssetLoaded(_key: string): boolean {
        return Boolean(this._cache[_key]);
    }

}