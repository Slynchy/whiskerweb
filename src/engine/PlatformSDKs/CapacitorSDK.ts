import { PlatformSDK } from "./PlatformSDK";
import { PurchaseResult } from "../Types/PurchaseResult";
import { IPlayerInfo } from "../Types/IPlayerInfo";
import { AD_TYPE } from "../Types/AdType";
import { App } from "@capacitor/app";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import isMobile from "is-mobile";
import {
    AdMob,
    AdMobBannerSize,
    BannerAdOptions,
    BannerAdPluginEvents, BannerAdPosition,
    BannerAdSize
} from "@capacitor-community/admob";
import {ENGINE_DEBUG_MODE} from "../Constants/Constants";
import { IPlatformFriend } from "../Types/IPlatformFriend";

export class CapacitorSDK extends PlatformSDK {

    constructor() {
        super();
    }


    addOnBackCallback(cb: () => void): void {
        if(isMobile()) {
            App.addListener("backButton", cb);
        } else {
            window.addEventListener('popstate', cb, false);
        }
    }

    addOnPauseCallback(cb: () => void): void {
        App.addListener("pause", cb);
    }

    addOnResumeCallback(cb: () => void): void {
        App.addListener("resume", cb);
    }

    public lockOrientation(_orientation: "portrait" | "landscape"): Promise<boolean> {
        return ScreenOrientation.lock({
            orientation: _orientation
        })
            .catch(() => {
                return false;
            })
            .then((_val: boolean) => {
                return _val !== false;
            });
    }

    public unlockOrientation(): Promise<boolean> {
        return ScreenOrientation.unlock()
            .catch(() => {
                return false;
            })
            .then((_val: boolean) => {
                return _val !== false;
            });
    }

    createContext(_suggestedPlayerID: string | Array<string> | null): Promise<void> {
        return Promise.resolve(undefined);
    }

    flush(): Promise<void> {
        return Promise.resolve(undefined);
    }

    getAdvertisementInstance(
        _type: AD_TYPE,
        _placementId: string
    ): Promise<
        any
    > {
        if(_type !== AD_TYPE.BANNER)
            return;

        AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
            // Subscribe Banner Event Listener
        });

        AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size: AdMobBannerSize) => {
            // Subscribe Change Banner Size
        });

        const options: BannerAdOptions = {
            adId: _placementId,
            adSize: BannerAdSize.BANNER,
            position: BannerAdPosition.TOP_CENTER,
            margin: 0,
            // isTesting: true
            // npa: true
        };

        return Promise.resolve({
            getPlacementID: () => _placementId,
            loadAsync: () => {
                return Promise.resolve();
            },
            showAsync: () => {
                return AdMob.showBanner(options);
            }
        });

    }

    getContextId(): string {
        return "";
    }

    getContextType(): string {
        return "";
    }

    getEntryPointAsync(): Promise<string> {
        return Promise.resolve("");
    }

    getEntryPointData(): { [p: string]: unknown } {
        return {};
    }

    getFriends(): Promise<IPlatformFriend[]> {
        return Promise.resolve([]);
    }

    getIAPCatalog(): Promise<any> {
        return Promise.resolve([]);
    }

    getPlayerId(): string {
        return "";
    }

    getPlayerInfo(): IPlayerInfo {
        return undefined;
    }

    getPlayerLocale(): string {
        return "";
    }

    getPlayerName(): string {
        return "";
    }

    getPlayerPicUrl(): string {
        return "";
    }

    getSignedInfo(_payload?: string): Promise<any> {
        return Promise.resolve(undefined);
    }

    hideBannerAd(_placementId: string): Promise<void> {
        return Promise.resolve(undefined);
    }

    async initialize(): Promise<void> {
        await AdMob.initialize({
            initializeForTesting: ENGINE_DEBUG_MODE
        });

        const trackingInfo =
            await AdMob.trackingAuthorizationStatus();
        console.log(trackingInfo);
    }

    isAdsSupported(): boolean {
        return false;
    }

    isIAPAvailable(): boolean {
        return false;
    }

    isReady(): boolean {
        return false;
    }

    load(): Promise<Record<string, unknown>> {
        return Promise.resolve(undefined);
    }

    purchaseAsync(_productId: string): Promise<PurchaseResult> {
        return Promise.resolve(undefined);
    }

    requestHapticFeedbackAsync(): Promise<boolean> {
        return Promise.resolve(false);
    }

    save(_data: Record<string, unknown>): Promise<void> {
        return Promise.resolve(undefined);
    }

    setLoadingProgress(_progress: number): Promise<void> {
        return Promise.resolve(undefined);
    }

    shareTournamentAsync(_config: { score: number; data?: { [p: string]: any } }): Promise<void> {
        return Promise.resolve(undefined);
    }

    showBannerAd(_placementId: string): Promise<void> {
        return Promise.resolve(undefined);
    }

    startGame(): Promise<void> {
        return Promise.resolve(undefined);
    }

    submitTournamentScoreAsync(_score: number): Promise<void> {
        return Promise.resolve(undefined);
    }

    switchContext(_id: string): Promise<boolean> {
        return Promise.resolve(false);
    }

}