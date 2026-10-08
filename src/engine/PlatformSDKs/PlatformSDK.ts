import { IPlayerInfo } from "../Types/IPlayerInfo";
import { AD_TYPE } from "../Types/AdType";
import { PurchaseResult } from "../Types/PurchaseResult";
import { IPlatformFriend } from "../Types/IPlatformFriend";

/**
 * Base class for platform integrations (passed to the engine as config `gamePlatform`).
 *
 * Every method has a default implementation with "offline" behaviour, so a subclass only overrides what its
 * platform supports: no ads, no in-app purchases, no friends, contexts or tournaments, an anonymous local player
 * with the browser's locale, pause/resume on window blur/focus, and an in-memory save/load.
 */
export abstract class PlatformSDK {
    // In-memory store behind the default save()/load()
    private _savedData: Record<string, unknown> = {};

    protected constructor() { /* nope */
    }

    /**
     * Initializes the SDK; the engine awaits it during init and logs (rather than throws) any error.
     * On FBInstant, this would *not* call `startGameAsync`.
     * Default: resolves immediately
     */
    public initialize(): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Default: does nothing (contexts aren't supported)
     */
    public createContext(_suggestedPlayerID: string | Array<string> | null): Promise<void> {
        return Promise.resolve();
    }

    /**
     * This only exists because Facebook has a distinction between init and starting.
     * Default: resolves immediately
     */
    public startGame(): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Default: a short `navigator.vibrate`; resolves false where vibration isn't available or is blocked
     */
    public requestHapticFeedbackAsync(): Promise<boolean> {
        try {
            if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
                return Promise.resolve(false);
            }
            return Promise.resolve(navigator.vibrate(100));
        } catch (err) {
            return Promise.resolve(false);
        }
    }

    /**
     * Reports boot progress to the platform (e.g. a native loading screen). The engine drives its own loading
     * screen separately, so this should not touch `ENGINE.loadingScreenObject`.
     * Default: does nothing
     * @param _progress The actual progress to set (0-100), not increment
     */
    public setLoadingProgress(_progress: number): Promise<void> {
        return Promise.resolve();
    }

    /**
     * The engine registers its pause callback here when config `pauseOnFocusLoss` is set.
     * Default: calls `cb` on window blur (addEventListener, so other handlers aren't replaced)
     */
    public addOnPauseCallback(cb: () => void): void {
        window.addEventListener("blur", () => cb());
    }

    /**
     * The engine registers its resume callback here when config `pauseOnFocusLoss` is set.
     * Default: calls `cb` on window focus (addEventListener, so other handlers aren't replaced)
     */
    public addOnResumeCallback(cb: () => void): void {
        window.addEventListener("focus", () => cb());
    }

    /**
     * Gets all player info at once (for game start), not optimal for any other use.
     * Default: built from getPlayerId(), getContextId(), getContextType(), getPlayerPicUrl() and getPlayerName()
     */
    public getPlayerInfo(): IPlayerInfo {
        return {
            playerId: this.getPlayerId(),
            contextId: this.getContextId(),
            contextType: this.getContextType(),
            playerPicUrl: this.getPlayerPicUrl(),
            playerName: this.getPlayerName(),
        };
    }

    /**
     * Default: ""
     */
    public getEntryPointAsync(): Promise<string> {
        return Promise.resolve("");
    }

    /**
     * Default: "" (anonymous local player)
     */
    public getPlayerName(): string {
        return "";
    }

    /**
     * Whether `getAdvertisementInstance` can return ads; `handleAd` checks this first.
     * Default: false
     */
    public isAdsSupported(): boolean {
        return false;
    }

    /**
     * Default: "" (anonymous local player)
     */
    public getPlayerId(): string {
        return "";
    }

    /**
     * The player's locale in `en_GB` form (see Constants/Locales).
     * Default: the browser's language (`navigator.language`, e.g. "en-GB" becomes "en_GB"), or "en_GB" if unavailable
     */
    public getPlayerLocale(): string {
        const language = typeof navigator !== "undefined" ? navigator.language : "";
        return language ? language.replace(/-/g, "_") : "en_GB";
    }

    /**
     * Default: "" (no picture)
     */
    public getPlayerPicUrl(): string {
        return "";
    }

    /**
     * Default: "" (no context)
     */
    public getContextId(): string {
        return "";
    }

    /**
     * Default: "SOLO"
     */
    public getContextType(): string {
        return "SOLO";
    }

    /**
     * Default: rejects (in-app purchases aren't supported; see isIAPAvailable())
     */
    public purchaseAsync(_productId: string): Promise<PurchaseResult> {
        return Promise.reject(new Error("In-app purchases are not supported on this platform"));
    }

    /**
     * Default: resolves with no friends
     */
    public getFriends(): Promise<IPlatformFriend[]> {
        return Promise.resolve([]);
    }

    /**
     * Default: does nothing (tournaments aren't supported)
     */
    public submitTournamentScoreAsync(_score: number): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Resolves true if the context was switched.
     * Default: resolves false (contexts aren't supported)
     */
    public switchContext(_id: string): Promise<boolean> {
        return Promise.resolve(false);
    }

    /**
     * Default: does nothing
     */
    public showBannerAd(_placementId: string): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Default: does nothing
     */
    public hideBannerAd(_placementId: string): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Resolves with an ad instance that has `loadAsync()` and `showAsync()` (see `handleAd`), or null if there is none.
     * Default: resolves null (ads aren't supported)
     */
    public getAdvertisementInstance(_type: AD_TYPE, _placementId: string): Promise<any> {
        return Promise.resolve(null);
    }

    /**
     * Default: {}
     */
    public getEntryPointData(): { [key: string]: unknown } {
        return {};
    }

    /**
     * Default: rejects (signed player info isn't supported)
     */
    public getSignedInfo(_payload?: string): Promise<any> {
        return Promise.reject(new Error("Signed player info is not supported on this platform"));
    }

    /**
     * Default: false
     */
    public isIAPAvailable(): boolean {
        return false;
    }

    /**
     * Default: resolves with an empty catalog
     */
    public getIAPCatalog(): Promise<any> {
        return Promise.resolve([]);
    }

    /*
        These functions should be pass-thru! A distinct class should handle saving/loading, all this
        class does is just link the function to the SDK.
        (The engine saves through its own SaveHandler/LocalStorageSaver, not through these.)
     */

    /**
     * Default: merges `_data` into an in-memory store that lasts until the page is closed
     */
    public save(_data: Record<string, unknown>): Promise<void> {
        Object.assign(this._savedData, _data);
        return Promise.resolve();
    }

    /**
     * Default: resolves with a copy of the in-memory store written by save()
     */
    public load(): Promise<Record<string, unknown>> {
        return Promise.resolve({ ...this._savedData });
    }

    /**
     * Default: does nothing
     */
    public flush(): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Default: true
     */
    public isReady(): boolean {
        return true;
    }
}
