import { AdPlacements } from "../Types/AdPlacements";

/**
 * @deprecated Unused by the engine. Pass ad unit IDs to the platform SDK instead,
 * e.g. `new CapacitorSDK({ adUnitIds: { banner: "ca-app-pub-..." } })` from "whiskerweb/capacitor".
 */
export const AdIDs = {
    [AdPlacements.INTERSTITIAL]: "",
    [AdPlacements.BANNER]: "",
    [AdPlacements.REWARDED]: "",
};
