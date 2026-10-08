import { AD_DEBUG } from "./Constants/Constants";
import { ANALYTICS_AD_TYPES } from "./Analytics/AnalyticsAdTypes";
import { AD_TYPE } from "./Types/AdType";
import type { Engine } from "./Engine";

let promiseCacheForInterstitials: Promise<boolean> = null;

/**
 * Loads and shows an ad through the engine's platform SDK.
 * Resolves true only if the ad was actually shown, and false if ads aren't supported on this platform,
 * no ad instance could be created, or loading/showing failed. Never rejects.
 * For rewarded ads, only grant the reward when this resolves true.
 * Overlapping interstitial requests share one ad (and one result).
 * @param _engine
 * @param _adType
 * @param _placement Placement/ad unit ID passed to `PlatformSDK.getAdvertisementInstance`
 */
export function handleAd(_engine: Engine, _adType: AD_TYPE, _placement: string): Promise<boolean> {
    const platformSDK = _engine?.platformSDK;
    const adTypeName = ANALYTICS_AD_TYPES[_adType] || String(_adType);

    if (!platformSDK || !platformSDK.isAdsSupported()) {
        if (AD_DEBUG) console.warn(`handleAd(): ads are not supported on this platform; not showing ${adTypeName} ad`);
        return Promise.resolve(false);
    }

    if (_adType === AD_TYPE.INTERSTITIAL && promiseCacheForInterstitials) {
        return promiseCacheForInterstitials;
    }

    const result: Promise<boolean> = platformSDK.getAdvertisementInstance(_adType, _placement)
        .then(async (adInstance) => {
            if (!adInstance) {
                if (AD_DEBUG) console.warn(`handleAd(): no ${adTypeName} ad instance for placement "${_placement}"`);
                return false;
            }
            await adInstance.loadAsync();
            await adInstance.showAsync();
            if (AD_DEBUG) console.log(`handleAd(): showed ${adTypeName} ad`);
            return true;
        })
        .catch((err) => {
            if (AD_DEBUG) console.warn(`handleAd(): failed to show ${adTypeName} ad`, err);
            return false;
        });

    if (_adType === AD_TYPE.INTERSTITIAL) {
        promiseCacheForInterstitials = result;
        result.then(() => {
            promiseCacheForInterstitials = null;
        });
    }

    return result;
}
