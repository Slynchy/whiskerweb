import { AD_DEBUG } from "./Constants/Constants";
import { ANALYTICS_AD_TYPES } from "./Analytics/AnalyticsAdTypes";
import { AD_TYPE } from "./Types/AdType";
import { Engine } from "../index";
import { AdPlacements } from "./Types/AdPlacements";

let promiseCacheForInterstitials: Promise<boolean> = null;

export function handleAd(_engine: Engine, _adType: AD_TYPE, _placement: string): Promise<boolean> {
    console.warn("handleAd() is temporarily deprecated after dropping FBInstant support");
    return Promise.resolve(true);
}
