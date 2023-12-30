import { Saver } from "./Saver";
import { IData } from "../Types/IData";
import { ENGINE_DEBUG_MODE } from "../Constants/Constants";

export class LocalStorageSaver extends Saver {

    protected _dataCache: Record<string, unknown>;

    clear(): Promise<void> {
        window.localStorage.clear();
        return Promise.resolve(undefined);
    }

    load(_keysToLoad?: string[]): Promise<IData> {
        const obj: { [key: string]: unknown } = {};
        for (let i = 0; i < _keysToLoad.length; i++) {
            try {
                obj[_keysToLoad[i]] = window.localStorage.getItem(_keysToLoad[i]);
                if(typeof obj[_keysToLoad[i]] === "string"
                    && (
                        (obj[_keysToLoad[i]] as string)[0] === "{"
                        ||
                        (obj[_keysToLoad[i]] as string)[0] === "["
                    )) {
                    // probably json
                    obj[_keysToLoad[i]] = JSON.parse(obj[_keysToLoad[i]] as string);
                }
            } catch(err) {
                // nope
                if(ENGINE_DEBUG_MODE) {
                    console.error(err);
                }
            }
        }
        return Promise.resolve(obj);
    }

    save(data: Partial<IData>): Promise<void> {
        const keys = Object.keys(data);
        for (let i = keys.length; i >= 0; i--) {
            const curr = keys[i];
            if (!Object.prototype.hasOwnProperty.call(data, curr))
                keys.splice(i, 1);
            else {
                // fixme: this might break
                try {
                    if(typeof data[curr] === "object") {
                        window.localStorage.setItem(curr, JSON.stringify(data[curr]));
                    } else {
                        window.localStorage.setItem(curr, data[curr] as string);
                    }
                    if (ENGINE_DEBUG_MODE) {
                        console.log(`[LocalStorageSaver] Saved key "%s" with data %o`, curr, data[curr]);
                    }
                } catch (err) {
                    console.error(err);
                }
            }
        }
        return Promise.resolve();
    }
}
