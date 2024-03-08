import { PlatformSDK } from "./PlatformSDK";
import { IPlayerInfo } from "../Types/IPlayerInfo";
import { DEFAULT_TEXTURE_B64 } from "../Constants/Constants";
import { AD_TYPE } from "../Types/AdType";
import { PurchaseResult } from "../Types/PurchaseResult";
import { uid } from "../HelperFunctions/uid";
import { IAPNames, IAPProductID } from "../Constants/IAPData";
import { IPlatformFriend } from "../Types/IPlatformFriend";

export class DummySDK extends PlatformSDK {

    private _contextId: string = null;

    constructor() {
        super();
    }

    public isIAPAvailable(): boolean {
        return true;
    }

    public isAdsSupported(): boolean {
        return true;
    }

    public requestHapticFeedbackAsync(): Promise<boolean> {
        try {
            window.navigator.vibrate(100);
            return Promise.resolve(true);
        } catch(err) {
            return Promise.resolve(false);
        }
    }

    public addOnPauseCallback(cb: () => void): void {
        if(!ENGINE.pauseOnFocusLoss) return;
        window.onblur = cb as (this: GlobalEventHandlers, ev: FocusEvent) => any;
    }

    public addOnResumeCallback(cb: () => void): void {
        if(!ENGINE.pauseOnFocusLoss) return;
        window.onfocus = cb as (this: GlobalEventHandlers, ev: FocusEvent) => any;
    }

    public setLoadingProgress(_progress: number): Promise<void> {
        const obj = ENGINE["loadingScreenObject"];
        if(
            obj &&
            // @ts-ignore
            typeof whiskerConfig.loadingScreenComponent["progress"] !== "undefined"
        ) {
            // @ts-ignore
            whiskerConfig.loadingScreenComponent["progress"] = _progress;
        }

        return Promise.resolve(undefined);
    }

    public initialize(): Promise<void> {
        return Promise.resolve(undefined);
    }

    public startGame(): Promise<void> {
        return Promise.resolve(undefined);
    }

    public getContextId(): string {
        return this._contextId;
    }

    public getContextType(): string {
        return "SOLO";
    }

    public getPlayerId(): string {
        return "1234";
    }

    public getEntryPointAsync(): Promise<string> {
        return Promise.resolve("debug");
    }

    public submitTournamentScoreAsync(_score: number): Promise<void> {
        return Promise.resolve();
    }

    public switchContext(_id: string): Promise<boolean> {
        this._contextId = _id;
        return Promise.resolve(true);
    }

    public async getAdvertisementInstance(_type: AD_TYPE, _placementId: string): Promise<any> {
        return {
            loadAsync(): Promise<void> {
                return Promise.resolve();
            },
            showAsync(): Promise<void> {
                return Promise.resolve();
            }
        };
    }

    public getPlayerInfo(): IPlayerInfo {
        return {
            playerId: this.getPlayerId(),
            contextId: this.getContextId(),
            contextType: this.getContextType(),
            playerPicUrl: this.getPlayerPicUrl(),
            playerName: this.getPlayerName(),
        };
    }

    public getPlayerName(): string {
        return "TEST";
    }

    public getPlayerPicUrl(): string {
        return DEFAULT_TEXTURE_B64;
    }

    public flush(): Promise<void> {
        return Promise.resolve(undefined);
    }

    public load(): Promise<Record<string, unknown>> {
        return Promise.resolve({});
    }

    public save(_data: Record<string, unknown>): Promise<void> {
        return Promise.resolve(undefined);
    }

    isReady(): boolean {
        return true;
    }

    public getPlayerLocale(): string {
        return "en_GB"; // ja_JP
    }

    hideBannerAd(_placementId: string): Promise<void> {
        return Promise.resolve(undefined);
    }

    showBannerAd(_placementId: string): Promise<void> {
        return Promise.resolve(undefined);
    }

    getEntryPointData(): { [key: string]: unknown } {
        return {};
    }

    createContext(_suggestedPlayerID: string | Array<string> | null): Promise<void> {
        return Promise.resolve();
    }

    getIAPCatalog(): Promise<any> {
        return Promise.resolve();
    }

    getSignedInfo(_payload?: string): Promise<any> {
        return Promise.reject(new Error("Not supported in localhost"));
    }

    getFriends(): Promise<IPlatformFriend[]> {
        return Promise.resolve([
            {
                name: "Ricky",
                uid: "123454321234",
                photoUrl: DEFAULT_TEXTURE_B64
            }
        ]);
    }

    purchaseAsync(_productId: string): Promise<PurchaseResult> {
        console.log(`Buying product ${_productId}`);
        return Promise.resolve({
            paymentID: uid(),
            productID: _productId,
            purchaseTime: (Math.floor(Date.now() / 1000)).toString(),
            purchaseToken: uid(),
            signedRequest: uid()
        });
    }

}
