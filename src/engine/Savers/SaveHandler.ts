import { Saver } from "./Saver";
import { ENGINE_DEBUG_MODE } from "../Constants/Constants";
import { IData } from "../Types/IData";
import { HelperFunctions } from "../HelperFunctions";
import { PlayerDataSingleton } from "../PlayerDataSingleton";

export class SaveHandler {

    public getLatestData: (_data: Array<IData>) => IData = (_d: IData[]) => _d[0];
    private readonly _savers: Saver[] = [];
    private _saveIntervalID: any = undefined;
    public autoSave: number = -1;

    constructor(_savers: Saver[]) {
        this._savers = _savers;
        // this._getLatestData = _getLatestData;
    }

    private _allowedToSave: boolean = false;

    public get allowedToSave(): boolean {
        return this._allowedToSave;
    }

    public set allowedToSave(_val: boolean) {
        console.log("SaveHandler now " + (_val ? "" : "not ") + "allowed to save.");
        this._allowedToSave = _val;

        if (this.allowedToSave && Boolean(this.autoSave) && !this._saveIntervalID) {
            this._saveIntervalID = setInterval(() => {
                if (this.allowedToSave && PlayerDataSingleton.isDirty()) {
                    // fixme: GAME CODE IN ENGINE CODE; sorry but deadlines :(
                    this.save(PlayerDataSingleton.export())
                        .catch((err) => {
                            console.error("Failed to autosave!");
                            console.error(err);
                        });
                } else if (!this.allowedToSave) {
                    clearInterval(this._saveIntervalID);
                }
            }, this.autoSave);
        }
    }

    public async save(_data: IData): Promise<void> {
        if (!this._allowedToSave) {
            return Promise.reject(new Error('SaveHandler is not currently allowed to save.'));
        }

        return new Promise<void>((resolve: () => void, reject: (err: unknown) => void) => {
            for (let i: number = 0; i < this._savers.length; i++) {
                const iCache = i;
                const curr: Saver = this._savers[i];

                curr
                    .save(_data)
                    .then((_res) => iCache === 0 ? resolve() : null)
                    .catch((err) => reject(err));
            }
        });
    }

    public async load(_keysToLoad?: string[]): Promise<IData> {
        const retVal: IData[] = [];
        retVal.length = this._savers.length;

        if (ENGINE_DEBUG_MODE) {
            console.log(`[SaveHandler] Loading keys ${_keysToLoad}`);
        }

        const retry = () => {
            const promises: Array<Promise<IData>> = [];
            for (let i: number = 0; i < this._savers.length; i++) {
                promises.push(
                    this._savers[i].load(_keysToLoad).then((_data: IData) => {
                        retVal[i] = (_data);
                        return _data;
                    })
                );
            }
            return Promise.allSettled(promises);
        };

        await retry().catch((err) => {
            console.error(err);
            return HelperFunctions.wait(750).then(() => retry()).catch(() => {
                console.error(err);
                return Promise.reject(err);
            });
        });

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

}
