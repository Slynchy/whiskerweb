import { IData } from "../engine/Types/IData";
import { SCALE_MODE } from "pixi.js";
import { Component } from "../engine/Component";
import { LoaderType } from "../engine/Loaders/LoaderType";
import { PlatformSDK } from "../engine/PlatformSDKs/PlatformSDK";
import { BaseAnalytics } from "../engine/Analytics/BaseAnalytics";

export type TBootAsset = { key: string; path: string; type: LoaderType };

/**
 * Engine configuration, passed to `engine.init`. Every field is optional;
 * the defaults are listed here and applied by `resolveWhiskerConfig`.
 */
export type TWhiskerConfig = {
  // --- Rendering ---
  /** Preferred renderer; falls back to WebGL. Default "webgpu" */
  renderType?: "webgpu" | "webgl";
  /** Initial stage size. Default window.innerWidth / window.innerHeight */
  width?: number;
  height?: number;
  /** How the canvas follows the window. "auto" is the same as "either". Default "either" */
  autoResize?: "auto" | "either" | "width" | "height" | "none";
  /** Starting render resolution; every resize switches to the live window.devicePixelRatio. Default window.devicePixelRatio */
  devicePixelRatio?: number;
  /** Default 0x000000 */
  backgroundColor?: number;
  /** Default 1 */
  backgroundAlpha?: number;
  /** Default false */
  antialias?: boolean;
  /** Default false */
  roundPixels?: boolean;
  /** Default scale mode for textures created after init. Default "linear" */
  scaleMode?: SCALE_MODE;
  /** Keep the bottom 60px clear for a banner ad. Default false */
  adjustHeightForBannerAd?: boolean;
  /** Show a stats.js FPS panel. Default false */
  showFPSTracker?: boolean;

  // --- Main loop ---
  /** Start the ticker during init; with false nothing updates or renders until a state starts it. Default true */
  autoStart?: boolean;
  /** engine.pause() on window blur, engine.resume() on focus. Default false */
  pauseOnFocusLoss?: boolean;

  // --- Assets and loading screen ---
  /** Loaded before the first state. Paths are relative to ./assets/. Default [] */
  bootAssets?: TBootAsset[];
  /** Component for a loading-screen GameObject drawn above everything. Default null (no loading screen) */
  loadingScreenComponent?: Component | null;
  /** Hide the loading screen once the first state (and, with showLoadingScreenOnStateChange, each later state) has awoken. Default false */
  autoHideLoadingScreen?: boolean;
  /** Show the loading screen again during every changeState, with loadAssets progress. Default false */
  showLoadingScreenOnStateChange?: boolean;

  // --- Saved data ---
  /** The only keys PlayerDataSingleton accepts. Default [] */
  playerDataKeys?: string[];
  /** Save changed keys every N ms (and when the page is hidden); 0 turns autosave off. Default 1000 */
  autoSave?: number;
  /** Prepended to every localStorage key, so games on the same origin don't collide. Default "" */
  saveKeyPrefix?: string;
  /** Picks the data to use when there are several savers. Default: the first saver's */
  getLatestData?: (e: IData[]) => IData;

  // --- Platform and analytics ---
  /** "offline" (DummySDK), a PlatformSDK subclass (constructed with no arguments), or an instance. Default "offline" */
  gamePlatform?: "offline" | PlatformSDK | (new () => PlatformSDK);
  /** Analytics modules, e.g. GameAnalytics from "whiskerweb/gameanalytics". Default [] */
  analytics?: BaseAnalytics[];
  /** Initialise the analytics modules during init. Default true */
  autoInitAnalytics?: boolean;
  /** "analytics" logs uncaught errors and promise rejections as analytics events ("firebase" is an old name for it). Default "none" */
  logErrors?: "none" | "analytics" | "firebase" | "sentry";
};

/** A config with every default applied */
export type TResolvedWhiskerConfig = Required<TWhiskerConfig>;

/**
 * Applies the defaults to a config. Fields that are missing or undefined get the default.
 */
export function resolveWhiskerConfig(_config: TWhiskerConfig = {}): TResolvedWhiskerConfig {
  const resolved: TResolvedWhiskerConfig = {
    renderType: "webgpu",
    width: window.innerWidth,
    height: window.innerHeight,
    autoResize: "either",
    devicePixelRatio: window.devicePixelRatio || 1,
    backgroundColor: 0x000000,
    backgroundAlpha: 1,
    antialias: false,
    roundPixels: false,
    scaleMode: "linear",
    adjustHeightForBannerAd: false,
    showFPSTracker: false,
    autoStart: true,
    pauseOnFocusLoss: false,
    bootAssets: [],
    loadingScreenComponent: null,
    autoHideLoadingScreen: false,
    showLoadingScreenOnStateChange: false,
    playerDataKeys: [],
    autoSave: 1000,
    saveKeyPrefix: "",
    getLatestData: (_data: IData[]) => _data[0],
    gamePlatform: "offline",
    analytics: [],
    autoInitAnalytics: true,
    logErrors: "none",
  };
  for (const key of Object.keys(_config) as Array<keyof TWhiskerConfig>) {
    if (_config[key] !== undefined) {
      (resolved as Record<string, unknown>)[key] = _config[key];
    }
  }
  return resolved;
}
