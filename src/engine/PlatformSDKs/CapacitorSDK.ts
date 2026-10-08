import { PlatformSDK } from "./PlatformSDK";
import { AD_TYPE } from "../Types/AdType";
import { AdPlacements } from "../Types/AdPlacements";
import { AD_DEBUG } from "../Constants/Constants";
import { App } from "@capacitor/app";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import type { OrientationLockType } from "@capacitor/screen-orientation";
import { Capacitor } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";
import {
    AdMob,
    BannerAdPluginEvents,
    BannerAdPosition,
    BannerAdSize,
    InterstitialAdPluginEvents,
    RewardAdPluginEvents,
} from "@capacitor-community/admob";
import type {
    AdLoadInfo,
    AdMobError,
    AdMobInitializationOptions,
    AdMobRewardItem,
    AdOptions,
} from "@capacitor-community/admob";

export interface ICapacitorSDKOptions {
    /**
     * AdMob ad unit IDs by placement name. The placement passed to `handleAd`, `showBannerAd` or
     * `getAdvertisementInstance` is looked up here first; a placement that is itself an ad unit ID ("ca-app-pub-...")
     * is used as is; anything else falls back to the entry for the ad type: "banner", "interstitial" or "rewarded"
     * (the AdPlacements values). Default {}
     */
    adUnitIds?: { [placement: string]: string };
    /**
     * Request Google's sample test ads instead of the real ad units (AdMob `isTesting`).
     * In this mode an ad type without a configured ad unit ID still gets a test ad. Default false
     */
    testing?: boolean;
    /** Device IDs to register as AdMob test devices; they get test ads from the real ad units. Default [] */
    testingDevices?: string[];
    /** Request non-personalised ads. Default false */
    npa?: boolean;
    /** Default BannerAdSize.BANNER (320x50, which fits the 60px kept free by config `adjustHeightForBannerAd`) */
    bannerSize?: BannerAdSize;
    /** Default BannerAdPosition.BOTTOM_CENTER (where config `adjustHeightForBannerAd` keeps space) */
    bannerPosition?: BannerAdPosition;
    /** Banner margin, in dp (Android) or points (iOS). Default 0 */
    bannerMargin?: number;
    /** Further AdMob.initialize options (COPPA/TFUA tags, max ad content rating) */
    admobOptions?: Omit<AdMobInitializationOptions, "testingDevices" | "initializeForTesting">;
    /**
     * On iOS, ask for App Tracking Transparency permission during initialize() if the player hasn't been asked yet.
     * Needs `NSUserTrackingUsageDescription` in Info.plist. Default false
     */
    requestTrackingAuthorization?: boolean;
}

// How long to wait after a rewarded ad closes for a reward reported late, before treating it as not earned
const LATE_REWARD_GRACE_MS = 500;

/**
 * Platform SDK for Capacitor apps (Android/iOS): AdMob banner, interstitial and rewarded ads, app pause/resume and
 * back-button events, and screen orientation locking. Everything else uses PlatformSDK's offline defaults.
 * Ads are only available on native platforms, once initialize() has initialized AdMob.
 */
export class CapacitorSDK extends PlatformSDK {

    private readonly _options: ICapacitorSDKOptions;
    private _adsInitialized: boolean = false;

    // Handles for the App listeners added by addOn*Callback, so they can be removed with removeAppListeners()
    private _appListenerHandles: Array<Promise<PluginListenerHandle>> = [];
    private _popStateCallbacks: Array<() => void> = [];
    // AdMob banner listeners for the banner currently shown; removed when it's hidden or replaced
    private _bannerListenerHandles: Array<Promise<PluginListenerHandle>> = [];

    constructor(_options: ICapacitorSDKOptions = {}) {
        super();
        this._options = { ..._options };
    }

    /**
     * Calls `cb` on the Android back button in a native app, or on `popstate` in a browser
     */
    addOnBackCallback(cb: () => void): void {
        if (Capacitor.isNativePlatform()) {
            this._appListenerHandles.push(App.addListener("backButton", cb));
        } else {
            window.addEventListener('popstate', cb, false);
            this._popStateCallbacks.push(cb);
        }
    }

    /**
     * Calls `cb` when the app goes to the background (in a browser: when the page is hidden)
     */
    addOnPauseCallback(cb: () => void): void {
        this._appListenerHandles.push(App.addListener("pause", cb));
    }

    /**
     * Calls `cb` when the app returns to the foreground (in a browser: when the page is shown)
     */
    addOnResumeCallback(cb: () => void): void {
        this._appListenerHandles.push(App.addListener("resume", cb));
    }

    /**
     * Removes every listener added by addOnBackCallback, addOnPauseCallback and addOnResumeCallback
     */
    public async removeAppListeners(): Promise<void> {
        const handles = this._appListenerHandles;
        this._appListenerHandles = [];
        this._popStateCallbacks.forEach((cb) => window.removeEventListener('popstate', cb, false));
        this._popStateCallbacks = [];
        await CapacitorSDK._removeListeners(handles);
    }

    private static async _removeListeners(handles: Array<Promise<PluginListenerHandle>>): Promise<void> {
        await Promise.all(handles.map(
            (handle) => handle.then((h) => h.remove()).catch((err) => console.warn(err))
        ));
    }

    private async _removeBannerListeners(): Promise<void> {
        const handles = this._bannerListenerHandles;
        this._bannerListenerHandles = [];
        await CapacitorSDK._removeListeners(handles);
    }

    /**
     * Resolves true if the orientation was locked
     */
    public lockOrientation(_orientation: OrientationLockType): Promise<boolean> {
        return ScreenOrientation.lock({ orientation: _orientation })
            .then(() => true, () => false);
    }

    /**
     * Resolves true if the orientation was unlocked
     */
    public unlockOrientation(): Promise<boolean> {
        return ScreenOrientation.unlock()
            .then(() => true, () => false);
    }

    async initialize(): Promise<void> {
        // AdMob's web implementation only logs to the console, so ads stay off in a browser (e.g. `npm start`)
        if (!Capacitor.isNativePlatform()) return;

        try {
            const testingDevices = this._options.testingDevices || [];
            await AdMob.initialize({
                ...this._options.admobOptions,
                testingDevices: testingDevices,
                initializeForTesting: testingDevices.length > 0,
            });
            this._adsInitialized = true;
        } catch (err) {
            console.warn("AdMob could not be initialized; ads are unavailable", err);
            return;
        }

        try {
            const trackingInfo = await AdMob.trackingAuthorizationStatus();
            if (AD_DEBUG) console.log("AdMob tracking authorization status: %o", trackingInfo);
            if (this._options.requestTrackingAuthorization && trackingInfo.status === "notDetermined") {
                await AdMob.requestTrackingAuthorization();
            }
        } catch (err) {
            console.warn("Could not get or request tracking authorization", err);
        }
    }

    /**
     * True once AdMob has been initialized, on Android or iOS
     */
    isAdsSupported(): boolean {
        return this._adsInitialized;
    }

    /**
     * Resolves with an ad instance for `handleAd`: `loadAsync()` prepares the ad, `showAsync()` shows it.
     * - Interstitial: showAsync() resolves once the ad is closed.
     * - Rewarded: showAsync() resolves with the reward once the ad is closed, and rejects if it was closed before
     *   the reward was earned.
     * - Banner: showAsync() shows the banner (replacing any other), `hideAsync()` removes it.
     *
     * Rejects if ads aren't available or no ad unit ID is configured for the placement (see ICapacitorSDKOptions.adUnitIds).
     */
    getAdvertisementInstance(_type: AD_TYPE, _placementId: string): Promise<any> {
        if (!this._adsInitialized)
            return Promise.reject(new Error("AdMob is not initialized; ads are only available on Android and iOS"));

        const adId = this._resolveAdId(_type, _placementId);
        if (adId === null)
            return Promise.reject(new Error(`No AdMob ad unit ID for ${AD_TYPE[_type]} placement "${_placementId}"`));

        switch (_type) {
            case AD_TYPE.BANNER:
                return Promise.resolve({
                    getPlacementID: () => _placementId,
                    // showBanner() loads the banner itself
                    loadAsync: () => Promise.resolve(),
                    showAsync: () => this._showBanner(adId),
                    hideAsync: () => this._removeBanner(),
                });
            case AD_TYPE.INTERSTITIAL:
            case AD_TYPE.REWARDED:
                return Promise.resolve(this._createFullscreenAdInstance(_type, _placementId, adId));
            default:
                return Promise.reject(new Error(`CapacitorSDK does not support ${AD_TYPE[_type]} ads`));
        }
    }

    /**
     * Shows a banner (does nothing where ads aren't available)
     */
    async showBannerAd(_placementId: string): Promise<void> {
        if (!this.isAdsSupported()) return;
        const banner = await this.getAdvertisementInstance(AD_TYPE.BANNER, _placementId);
        await banner.showAsync();
    }

    /**
     * Removes the banner (does nothing where ads aren't available)
     */
    async hideBannerAd(_placementId: string): Promise<void> {
        if (!this.isAdsSupported()) return;
        await this._removeBanner();
    }

    private _resolveAdId(_type: AD_TYPE, _placementId: string): string | null {
        const adUnitIds = this._options.adUnitIds || {};
        if (_placementId && adUnitIds[_placementId]) return adUnitIds[_placementId];
        if (_placementId && _placementId.startsWith("ca-app-pub-")) return _placementId;

        const placementForType = CapacitorSDK._placementForType(_type);
        if (placementForType && adUnitIds[placementForType]) return adUnitIds[placementForType];

        // In testing mode the plugin substitutes Google's sample ad unit for the ad type
        if (this._options.testing) return "";
        return null;
    }

    private static _placementForType(_type: AD_TYPE): AdPlacements | null {
        switch (_type) {
            case AD_TYPE.BANNER:
                return AdPlacements.BANNER;
            case AD_TYPE.INTERSTITIAL:
                return AdPlacements.INTERSTITIAL;
            case AD_TYPE.REWARDED:
                return AdPlacements.REWARDED;
            default:
                return null;
        }
    }

    private _adOptions(_adId: string): AdOptions {
        return {
            adId: _adId,
            isTesting: Boolean(this._options.testing),
            npa: Boolean(this._options.npa),
        };
    }

    private async _showBanner(_adId: string): Promise<void> {
        // Replace (not add to) the listeners of any banner shown before
        await this._removeBannerListeners();
        if (AD_DEBUG) {
            this._bannerListenerHandles.push(
                AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (error: AdMobError) => {
                    console.warn("Banner ad failed to load", error);
                }),
            );
        }
        try {
            await AdMob.showBanner({
                ...this._adOptions(_adId),
                adSize: this._options.bannerSize ?? BannerAdSize.BANNER,
                position: this._options.bannerPosition ?? BannerAdPosition.BOTTOM_CENTER,
                margin: this._options.bannerMargin ?? 0,
            });
        } catch (err) {
            await this._removeBannerListeners();
            throw err;
        }
    }

    private async _removeBanner(): Promise<void> {
        try {
            await AdMob.removeBanner();
        } finally {
            await this._removeBannerListeners();
        }
    }

    private _createFullscreenAdInstance(_type: AD_TYPE.INTERSTITIAL | AD_TYPE.REWARDED, _placementId: string, _adId: string) {
        // The ad unit the plugin actually prepared (the sample one in testing mode); null until loaded
        let preparedAdId: string | null = null;

        const load = async (): Promise<void> => {
            const info: AdLoadInfo = _type === AD_TYPE.REWARDED
                ? await AdMob.prepareRewardVideoAd(this._adOptions(_adId))
                : await AdMob.prepareInterstitial(this._adOptions(_adId));
            preparedAdId = (info && info.adUnitId) || _adId;
        };

        return {
            getPlacementID: () => _placementId,
            loadAsync: load,
            showAsync: async (): Promise<void | AdMobRewardItem> => {
                if (preparedAdId === null) await load();
                // A prepared ad can only be shown once
                const adId = preparedAdId;
                preparedAdId = null;
                return _type === AD_TYPE.REWARDED ? this._showRewarded(adId) : this._showInterstitial(adId);
            },
        };
    }

    /**
     * Resolves once the interstitial is closed; rejects if it fails to show
     */
    private async _showInterstitial(_adId: string): Promise<void> {
        const listeners: Array<Promise<PluginListenerHandle>> = [];
        try {
            await new Promise<void>((resolve, reject) => {
                listeners.push(
                    AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => resolve()),
                    AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, (error: AdMobError) => {
                        reject(CapacitorSDK._toError("Interstitial ad failed to show", error));
                    }),
                );
                Promise.all(listeners)
                    // Resolves as soon as the ad is shown, so completion comes from the Dismissed event
                    .then(() => AdMob.showInterstitial(_adId ? { adId: _adId } : undefined))
                    .catch(reject);
            });
        } finally {
            await CapacitorSDK._removeListeners(listeners);
        }
    }

    /**
     * Resolves with the reward once the rewarded ad is closed; rejects if it fails to show or is closed before the
     * reward was earned
     */
    private async _showRewarded(_adId: string): Promise<AdMobRewardItem> {
        const listeners: Array<Promise<PluginListenerHandle>> = [];
        try {
            return await new Promise<AdMobRewardItem>((resolve, reject) => {
                let reward: AdMobRewardItem | null = null;
                listeners.push(
                    AdMob.addListener(RewardAdPluginEvents.Rewarded, (item: AdMobRewardItem) => {
                        reward = item;
                    }),
                    AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
                        setTimeout(() => {
                            if (reward) resolve(reward);
                            else reject(new Error("Rewarded ad was closed before the reward was earned"));
                        }, LATE_REWARD_GRACE_MS);
                    }),
                    AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error: AdMobError) => {
                        reject(CapacitorSDK._toError("Rewarded ad failed to show", error));
                    }),
                );
                Promise.all(listeners)
                    // Resolves when the reward is earned (and never if it isn't), so completion comes from Dismissed
                    .then(() => AdMob.showRewardVideoAd(_adId ? { adId: _adId } : undefined))
                    .then((item) => {
                        reward = reward || item;
                    })
                    .catch(reject);
            });
        } finally {
            await CapacitorSDK._removeListeners(listeners);
        }
    }

    private static _toError(_message: string, _error: AdMobError): Error {
        return new Error(_error ? `${_message}: ${_error.message} (code ${_error.code})` : _message);
    }
}
