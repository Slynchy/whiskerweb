export interface ILoaderReturnValue {
    [key: string]: { success: boolean, error?: Error }
}

export abstract class Loader<T> {
    public isLoading: boolean = false;
    private _activeLoads: number = 0;

    public abstract isAssetLoaded(_key: string): boolean;

    public abstract add(_key: string, _asset: string): void;

    public abstract has(_key: string): boolean;

    public abstract get<T>(_key: string): T;

    /**
     * Load any enqueued assets (retrying failures once), resolves when done.
     * Failed assets don't reject; they are reported with `success: false` in the result.
     * @param _onProgress Function callback with progress parameter (expressed as 0 to 100 because Facebook)
     */
    public abstract load(_onProgress?: (progress: number) => void): Promise<ILoaderReturnValue>;

    public abstract unload(_key: string): void;

    public abstract cache<T>(_key: string, _asset: T): void;

    /**
     * Runs a load, keeping `isLoading` true while any load is in progress
     */
    protected async trackLoading<R>(_load: () => Promise<R>): Promise<R> {
        this._activeLoads++;
        this.isLoading = true;
        try {
            return await _load();
        } finally {
            this._activeLoads--;
            this.isLoading = this._activeLoads > 0;
        }
    }
}
