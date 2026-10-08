// "whiskerweb/capacitor": the Capacitor platform SDK (AdMob ads, app pause/resume, screen orientation).
// Needs the optional peer dependencies "@capacitor/core", "@capacitor/app", "@capacitor/screen-orientation"
// and "@capacitor-community/admob"; kept out of the main entry point so they are only bundled when imported.
export * from "./engine/PlatformSDKs/CapacitorSDK";
// AdMob enums used in CapacitorSDK options
export { BannerAdSize, BannerAdPosition, MaxAdContentRating } from "@capacitor-community/admob";
