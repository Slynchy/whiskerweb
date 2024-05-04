import { IData } from "../engine/Types/IData";
import { SCALE_MODE } from "pixi.js";
import { Component } from "../engine/Component";
import { LoaderType } from "../engine/Loaders/LoaderType";
import { PlatformSDK } from "../engine/PlatformSDKs/PlatformSDK";

export type TWhiskerConfig = {
  renderType?: "webgpu" | "webgl";
  bootAssets: Array<{ key: string; path: string; type: LoaderType }>;
  loadingScreenComponent: Component | null;
  autoHideLoadingScreen?: boolean;
  width: number;
  height: number;
  showFPSTracker: boolean;
  backgroundColor: number;
  backgroundAlpha: number;
  antialias: boolean;
  sharedTicker: boolean;
  sharedLoader: boolean;
  autoStart: boolean;
  roundPixels?: boolean;
  playerDataKeys: string[];
  defaultCameraType?: "perspective" | "orthographic";
  devicePixelRatio: number;
  autoResize: "either" | "width" | "height" | "none";
  // maintainResolution: boolean; // if true, continue using config resolution even if canvas size changes
  gamePlatform: "offline" | "capacitor" | typeof PlatformSDK;
  autoSave: number | 0; // if >0, then save every specified milliseconds
  getLatestData: (e: IData[]) => IData;
  logErrors: "none" | "firebase" | "sentry"; // sentry not yet supported
  autoInitFirebase: boolean;
  adjustHeightForBannerAd: boolean;
  scaleMode: SCALE_MODE;
  printFatalErrorsToHTML: boolean;
  pauseOnFocusLoss: boolean;
  autoInitAnalytics: boolean;
  // autoLoadState: State | null,
};
