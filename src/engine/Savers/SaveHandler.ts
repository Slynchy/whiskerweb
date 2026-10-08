import { Saver } from "./Saver";
import { ENGINE_DEBUG_MODE } from "../Constants/Constants";
import { IData } from "../Types/IData";
import { PlayerDataSingleton } from "../PlayerDataSingleton";

export class SaveHandler {

    public getLatestData: (_data: Array<IData>) => IData = (_d: IData[]) => _d[0];
    private readonly _savers: Saver[] = [];
    private _saveIntervalID: ReturnType<typeof setInterval> | undefined = undefined;
    private _autoSave: number = 0;
    private _allowedToSave: boolean = false;

    constructor(_savers: Saver[]) {
        this._savers = _savers;

        // Autosave runs on an interval, so also write pending changes when the page is hidden or closed
        const flushIfAutosaving = (): void => {
            if (this._autoSave > 0) void this.flush();
        };
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "hidden") flushIfAutosaving();
        });
        window.addEventListener("pagehide", flushIfAutosaving);
    }

    /**
     * Autosave interval in milliseconds; 0 (or less) turns autosave off
     */
    public get autoSave(): number {
        return this._autoSave;
    }

    public set autoSave(_ms: number) {
        this._autoSave = _ms > 0 ? _ms : 0;
        this._updateAutoSave();
    }

    public get allowedToSave(): boolean {
        return this._allowedToSave;
    }

    public set allowedToSave(_val: boolean) {
        if (ENGINE_DEBUG_MODE) {
            console.log("SaveHandler now " + (_val ? "" : "not ") + "allowed to save.");
        }
        this._allowedToSave = _val;
        this._updateAutoSave();
    }

    /**
     * Saves the PlayerDataSingleton keys changed since the last save.
     * If saving fails, the keys stay dirty so the next save retries them.
     */
    public flush(): Promise<void> {
        if (!this._allowedToSave || !PlayerDataSingleton.isDirty()) {
            return Promise.resolve();
        }
        if (ENGINE_DEBUG_MODE) {
            console.log("Saving...");
        }
        const data = PlayerDataSingleton.export();
        return this.save(data).catch((err) => {
            PlayerDataSingleton.dirtify(Object.keys(data));
            console.error("Failed to save!");
            console.error(err);
        });
    }

    /**
     * Saves the data with every saver; resolves once all of them have saved, rejects if any fails
     */
    public async save(_data: IData): Promise<void> {
        if (!this._allowedToSave) {
            throw new Error('SaveHandler is not currently allowed to save.');
        }
        await Promise.all(this._savers.map((saver) => saver.save(_data)));
    }

    public async load(_keysToLoad?: string[]): Promise<IData> {
        const retVal: IData[] = [];
        retVal.length = this._savers.length;

        if (ENGINE_DEBUG_MODE) {
            console.log(`[SaveHandler] Loading keys ${_keysToLoad}`);
        }

        const loadFrom = async (i: number): Promise<boolean> => {
            try {
                retVal[i] = await this._savers[i].load(_keysToLoad);
                return true;
            } catch (err) {
                console.error(err);
                return false;
            }
        };

        const results = await Promise.all(this._savers.map((_s, i) => loadFrom(i)));
        const failed = results.map((ok, i) => ok ? -1 : i).filter((i) => i !== -1);
        if (failed.length > 0) {
            // Retry the savers that failed once, after a short wait
            await new Promise<void>((resolve) => setTimeout(resolve, 750));
            await Promise.all(failed.map((i) => loadFrom(i)));
        }

        return this.getLatestData(retVal);
    }

    public clear(): Promise<void[]> {
        const promises: Promise<void>[] = [];
        for (let i = 0; i < this._savers.length; i++) {
            const curr = this._savers[i];
            promises.push(curr.clear());
        }
        return Promise.all(promises);
    }

    private _updateAutoSave(): void {
        if (this._saveIntervalID !== undefined) {
            clearInterval(this._saveIntervalID);
            this._saveIntervalID = undefined;
        }
        if (this._allowedToSave && this._autoSave > 0) {
            this._saveIntervalID = setInterval(() => void this.flush(), this._autoSave);
        }
    }
}
