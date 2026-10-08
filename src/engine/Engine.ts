import { StateManager } from "./StateManager";
import { State } from "./State";
import {
  Container,
  Spritesheet,
  Texture as PIXITexture,
  Ticker as PIXITicker,
  SCALE_MODE,
  TextureSource,
  WebGLRenderer,
  Texture,
} from "pixi.js";
import { RenderManager } from "./RenderManager";
import { PIXILoader } from "./Loaders/PIXILoader";
import {
  resolveWhiskerConfig,
  TResolvedWhiskerConfig,
  TWhiskerConfig,
} from "../config/whiskerConfig";
import {
  ENGINE_DEBUG_MODE,
  LOADTIME_DEBUG_MODE,
} from "./Constants/Constants";
import { __WWVERSION } from "./Constants/Version";
import { ENGINE_ERROR } from "./ErrorCodes/EngineErrorCodes";
import { Group, Tween } from "@tweenjs/tween.js";
import { tweenGroup, updateTweens } from "./TweenGroup";
import { PlatformSDK } from "./PlatformSDKs/PlatformSDK";
import { DummySDK } from "./PlatformSDKs/DummySDK";
import { SaveHandler } from "./Savers/SaveHandler";
import { LocalStorageSaver } from "./Savers/LocalStorageSaver";
import { Saver } from "./Savers/Saver";
import { AnalyticsHandler } from "./Analytics/AnalyticsHandler";
import { BaseAnalytics } from "./Analytics/BaseAnalytics";
import { LoadtimeMeasurer } from "./Debug/LoadtimeMeasurer";
import { GameObject } from "./GameObject";
import { HelperFunctions } from "./HelperFunctions";
import { PlayerDataSingleton } from "./PlayerDataSingleton";
import { LoaderType } from "./Loaders/LoaderType";
import isMobile from "is-mobile";
import { JSONLoader } from "./Loaders/JSONLoader";
import { WASMLoader } from "./Loaders/WASMLoader";
import { LogoAscii } from "../config/ascii";
import { Scene } from "./Scene";
import InputManager from "./InputManager";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Stats = require("stats.js");

declare global {
  const ENGINE: Engine;
  // const _PAGE_START_TIME: number;
}

type TAutoResize = "either" | "width" | "height" | "none";

export class Engine {
  // CONST PROPS
  private readonly ticker: PIXITicker;
  private readonly stateManager: StateManager;
  private readonly loader: PIXILoader;
  private readonly jsonLoader: JSONLoader;
  private readonly wasmLoader: WASMLoader;
  private readonly renderManager: RenderManager;
  private readonly stage: Container;
  private readonly inputManager: InputManager;
  private saveHandler: SaveHandler;
  private analyticsHandler: AnalyticsHandler;
  private platformSdk: PlatformSDK;

  // DEBUG
  // @ts-ignore
  private fpsDisplay: Stats;
  private readonly loadtimeMeasurer: LoadtimeMeasurer;

  // RUNTIME PROPS
  /**
   * If true, pauses tickers/rendering when window loses focus
   */
  public pauseOnFocusLoss: boolean = false;
  /**
   * Whether to auto-resize the renderer when the window changes size, and how
   */
  public autoResize: TAutoResize;
  /**
   * The loading screen object to instantiate when loading states
   */
  public loadingScreenObject: GameObject | null = null;
  private dt: number = 1;
  private _scaleFactor: number = 1;
  private _pauseRendering: boolean = false;
  private _onErrorFunctions: Array<typeof window.onerror> = [];
  private _onPromiseRejectionFunctions: Array<
    (ev: PromiseRejectionEvent) => void
  > = [];
  private _loadAssetsPromise: Promise<void>;
  private _adjustHeightForBannerAd: boolean = false;
  private _pausedTweens: Tween[] = [];
  private _paused: boolean = false;
  private _config: TResolvedWhiskerConfig = resolveWhiskerConfig();

  constructor() {
    if ((window as unknown as { ENGINE: Engine }).ENGINE)
      throw new Error(ENGINE_ERROR.MULTIPLE_INSTANCE);

    if (LOADTIME_DEBUG_MODE) {
      this.loadtimeMeasurer = new LoadtimeMeasurer();
    }

    this.stage = new Container();
    // this.stage.sortableChildren = true;
    this.ticker = new PIXITicker();
    this.stateManager = new StateManager(this);
    this.renderManager = new RenderManager(this);
    this.inputManager = new InputManager();

    this.loader = new PIXILoader();
    this.jsonLoader = new JSONLoader();
    this.wasmLoader = new WASMLoader();

    this.getTicker().add(this.mainLoop);

    // @ts-ignore
    window.ENGINE = this;
  }

  public getRenderManager(): RenderManager {
    return this.renderManager;
  }

  public hasJSON(key: string): boolean {
    return this.jsonLoader.isAssetLoaded(key);
  }

  public getJSON<T extends object>(key: string): T {
    return this.jsonLoader.get(key);
  }

  public getTicker(): PIXITicker {
    return this.ticker;
  }

  public getStage(): Container {
    return this.stage;
  }

  public get scaleFactor(): number {
    return this._scaleFactor;
  }

  public get platformSDK(): PlatformSDK {
    return this.platformSdk;
  }

  public getInputManager(): InputManager {
    return this.inputManager;
  }

  public getSaveHandler(): SaveHandler {
    return this.saveHandler;
  }

  public get renderingPaused(): boolean {
    return this._pauseRendering;
  }

  public set renderingPaused(val: boolean) {
    this._pauseRendering = val;
  }

  get deltaTime(): number {
    return this.dt;
  }

  set deltaTime(dt: number) {
    this.dt = dt;
  }

  /**
   * @deprecated Shouldn't use
   * @private
   */
  private _getPlayerDataSingleton(): typeof PlayerDataSingleton {
    if (ENGINE_DEBUG_MODE) {
      return PlayerDataSingleton;
    } else {
      return null;
    }
  }

  /**
   * @returns True if the asset is loaded, false if it's not
   * @param _key
   */
  public isPIXIAssetLoaded(_key: string): boolean {
    return this.loader.isAssetLoaded(_key) || false;
  }

  /**
   * Initializes the analytics handler
   */
  public initializeAnalytics(): void {
    this.analyticsHandler.initialize();
  }

  /**
   * Get a loaded WASM module from cache
   */
  public getWASM<T>(_key: string): T | null {
    return this.wasmLoader.get(_key) || null;
  }

  /**
   * Get a loaded PIXI texture from cache
   * @param _key
   * @returns The texture, or `Texture.EMPTY` (with a warning) if it isn't loaded
   */
  public getTexture(_key: string): PIXITexture {
    const asset: unknown = this.loader.get(_key);
    if (asset instanceof Texture) {
      return asset;
    }
    console.warn(
      asset ? "%s is not a texture (is it a spritesheet?)" : "Failed to find texture %s",
      _key,
    );
    return Texture.EMPTY;
  }

  /**
   * Sets the default scale mode for textures created after this call
   * (so call it before loading the assets it should apply to)
   * @param scaleMode "nearest" or "linear"
   */
  public setScaleMode(scaleMode: SCALE_MODE): void {
    TextureSource.defaultOptions.scaleMode = scaleMode;
  }

  /**
   * Returns true if any loaders are loading
   */
  public isLoaderLoading(): boolean {
    return (
      this.loader.isLoading ||
      this.jsonLoader.isLoading ||
      this.wasmLoader.isLoading
    );
  }

  /**
   * Adds an analytics module after init (e.g. once the player has consented).
   * Call `initializeAnalytics()` afterwards if the handler wasn't initialised yet.
   */
  public addAnalyticsModule(_module: BaseAnalytics): void {
    this.analyticsHandler.addModule(_module);
  }

  /**
   * Gets the currently-loaded state from StateManager
   */
  public getActiveState(): State {
    return this.stateManager.getState();
  }

  /**
   * Requests haptic feedback from the platform SDK, returns true if successful
   */
  public requestHapticFeedback(): Promise<boolean> {
    if (
      !isMobile()
      // || PlayerDataSingleton.isVibrationDisabled()
    )
      return Promise.resolve(false);
    else {
      return this.platformSDK.requestHapticFeedbackAsync();
    }
  }

  /**
   * Hooks a function to be called when an unhandled error occurs
   * @param _func
   */
  public hookOnError(_func: typeof window.onerror): void {
    this._onErrorFunctions.push(_func);
  }

  /**
   * Hooks a function to be called when an unhandled promise rejection occurs
   * @param _func
   */
  public hookOnPromiseRejection(
    _func: (ev: PromiseRejectionEvent) => void,
  ): void {
    this._onPromiseRejectionFunctions.push(_func);
  }

  /**
   * Resizes the renderer to the specified width and height
   * For people who know what they're doing, otherwise use `autoResize`
   * @param _w
   * @param _h
   * @param _autoResizeVal
   */
  public resizeRenderer(
    _w: number,
    _h: number,
    _autoResizeVal?: TAutoResize,
  ): void {
    if (_autoResizeVal === "either") {
      this.autoResize =
        this.renderManager.height > this.renderManager.width
          ? "height"
          : "width";
    }
    RenderManager.configureRenderer2d(
      _w,
      _h,
      this,
      this.renderManager.getRenderer(),
    );
    if (ENGINE_DEBUG_MODE) {
      this.renderManager.createDebugGrid();
    }
  }

  /**
   * Unloads the current state and loads the specified state.
   * With config `showLoadingScreenOnStateChange`, the loading screen is shown (at 0% progress) until the
   * new state has awoken, and hidden then if `autoHideLoadingScreen` is set. It stays up if preload fails.
   * @param _newState
   * @param _params Parameters to pass to the new state
   */
  public changeState(_newState: State, _params?: unknown): Promise<void> {
    if (this._config.showLoadingScreenOnStateChange) {
      this.showLoadingScreen();
    }
    return this.stateManager.setState(_newState, _params).then(() => {
      // Skip if another changeState replaced this state while it was loading
      if (
        this._config.autoHideLoadingScreen &&
        this.getActiveState() === _newState
      ) {
        this.hideLoadingScreen();
      }
    });
  }

  /**
   * Shows the loading screen (if config `loadingScreenComponent` was set) above everything, at 0% progress
   */
  public showLoadingScreen(): void {
    if (!this.loadingScreenObject) return;
    this.setLoadingScreenProgress(0);
    this.loadingScreenObject.visible = true;
  }

  public hideLoadingScreen(): void {
    if (!this.loadingScreenObject) return;
    this.loadingScreenObject.visible = false;
  }

  public get isLoadingScreenVisible(): boolean {
    return Boolean(this.loadingScreenObject?.visible);
  }

  /**
   * Sets `progress` (0-100) on every component of the loading screen that has a `progress` property.
   * `loadAssets` calls this while the loading screen is visible.
   */
  public setLoadingScreenProgress(_progress: number): void {
    if (!this.loadingScreenObject) return;
    this.loadingScreenObject.getComponents().forEach((component) => {
      if ("progress" in component) {
        (component as unknown as { progress: number }).progress = _progress;
      }
    });
  }

  /**
   * Forces a frame render
   */
  public forceRender(): void {
    this.renderManager.getRenderer().render(this.stage);
  }

  /**
   * Sets the refresh rate of the ticker/renderer
   * @param fps
   */
  public setMaxFPS(fps: number): void {
    this.ticker.maxFPS = fps;
  }

  /**
   * Stops the ticker and pauses every running tween, so tweens carry on from the same point on `resume()`.
   * (Tweens run on wall-clock time, so stopping the ticker alone makes them jump ahead when it restarts.)
   */
  public pause(): void {
    if (this._paused) return;
    this._paused = true;
    this.ticker.stop();
    this._pausedTweens = tweenGroup
      .getAll()
      .filter((t) => t.isPlaying() && !t.isPaused());
    this._pausedTweens.forEach((t) => t.pause());
  }

  /**
   * Undoes `pause()`: resumes the paused tweens and starts the ticker
   */
  public resume(): void {
    if (!this._paused) return;
    this._paused = false;
    this._pausedTweens.forEach((t) => t.resume());
    this._pausedTweens = [];
    this.ticker.start();
  }

  /**
   * The tween group the engine updates each frame (also exported as `tweenGroup`).
   * tween.js doesn't put new tweens in any group, so add yours to this one.
   */
  public getTweenGroup(): Group {
    return tweenGroup;
  }

  public get isPaused(): boolean {
    return this._paused;
  }

  /**
   * Sets the background colour of the renderer/canvas
   * @param _col
   * @param _alpha (optional)
   */
  public setBackgroundColor(_col: number, _alpha?: number): void {
    this.renderManager.getRenderer().background.color = _col;
    if (typeof _alpha !== "undefined") {
      this.renderManager.getRenderer().background.alpha = _alpha;
    }
  }

  /**
   * Helper function for if a PIXI resource is loaded; also checks if it loaded with error
   * @param key
   */
  public hasPIXIResource(key: string): boolean {
    const exists = this.loader.has(key);
    const target = exists ? this.loader.get(key) : null;
    return exists && !(target as any)?.error;
  }

  /**
   * Gets the specified PIXI resource from the loader, if it exists
   * @param key
   * @returns The PIXI texure/spritesheet, or undefined if it doesn't exist
   */
  public getPIXIResource(key: string): PIXITexture | Spritesheet {
    const tex: any = this.loader.get(key);
    if (ENGINE_DEBUG_MODE && !tex) {
      console.warn("Failed to find texture: " + key);
    }
    if (tex?.texture) {
      return tex.texture;
    } else if (tex?.spritesheet) {
      return tex.spritesheet;
    } else {
      return tex;
    }
  }

  /**
   * Manually adds the specified asset to the PIXI loader cache
   * For people who know what they're doing.
   * @param key
   * @param asset
   */
  public cachePIXIResource(key: string, asset: any): void {
    this.loader.cache(key, asset);
  }

  /**
   * Unloads the specified asset from the PIXI loader cache.
   * Assets loaded through `loadAssets` are also unloaded from PIXI Assets, which destroys their textures.
   * @param key
   */
  public unloadPIXIResource(key: string): void {
    this.loader.unload(key);
  }

  /**
   * Records a loadtime event
   * @deprecated Not yet properly implemented
   * @param _name
   * @param _force
   */
  public recordLoadtime(_name?: string, _force?: boolean): Promise<void> {
    // const-guarded/written this way to support tree-shaking easier
    if (LOADTIME_DEBUG_MODE) {
      if (!_force) {
        return HelperFunctions.wait(1).then(() => {
          this.loadtimeMeasurer.recordLoadtime(_name);
        });
      } else {
        this.loadtimeMeasurer.recordLoadtime(_name);
      }
    }
    return Promise.resolve();
  }

  /**
   * `window.alert`s the loadtime as a string, for debugging
   */
  public alertLoadtime(): void {
    if (LOADTIME_DEBUG_MODE) {
      alert(this.exportLoadtimeAsString());
    }
  }

  /**
   * Exports the loadtime as a string, for debugging
   */
  public exportLoadtimeAsString(): string {
    if (LOADTIME_DEBUG_MODE) {
      return this.loadtimeMeasurer.exportLoadtime();
    }
  }

  /**
   * Function that is called when a resize event is called, or to force a resize
   */
  public onResize(): void {
    if (ENGINE_DEBUG_MODE) console.log("Resize triggered");
    this.resizeRenderer(window.innerWidth, window.innerHeight, this.autoResize);
    this.getActiveState()?.onResize?.(this);
  }

  /**
   * Processes a spritesheet and adds its textures to the PIXI loader cache
   * @param _spritesheet
   * @returns True on success, false on failure
   */
  public processSpritesheet(_spritesheet: Spritesheet): boolean {
    try {
      Object.keys(_spritesheet.textures).forEach((k) => {
        if (
          !Object.prototype.hasOwnProperty.call(_spritesheet.textures, k) ||
          this.hasPIXIResource(k)
        )
          return;
        this.cachePIXIResource(k, _spritesheet.textures[k]);
      });
    } catch (err) {
      console.error(err);
      return false;
    }
    return true;
  }

  /**
   * Logs an analytics event with the analytics handler
   * @param eventName
   * @param valueToSum
   * @param parameters
   */
  public logEvent(
    eventName: string,
    valueToSum?: number,
    parameters?: { [key: string]: string },
  ): void {
    parameters = parameters || {};
    return this.analyticsHandler.logEvent(eventName, valueToSum || undefined, {
      version: __WWVERSION,
      ...parameters,
    });
  }

  /**
   * Main initialization function for the engine
   * @param _initialState State to load into
   * @param _userConfig Configuration object for engine; every field is optional (see `TWhiskerConfig`)
   * @param _onProgress (optional) Callback for loading progress
   */
  public async init(
    _initialState: State,
    _userConfig: TWhiskerConfig = {},
    _onProgress?: (_val: number) => void,
  ): Promise<unknown> {
    const _config = (this._config = resolveWhiskerConfig(_userConfig));
    await this.inputManager.initialize();
    this._adjustHeightForBannerAd = _config.adjustHeightForBannerAd;
    this.pauseOnFocusLoss = _config.pauseOnFocusLoss;
    this.setScaleMode(_config.scaleMode);
    if (_config.autoResize === "either" || _config.autoResize === "auto") {
      this.autoResize = _config.height > _config.width ? "height" : "width";
    } else {
      this.autoResize = _config.autoResize;
    }

    if (_config.logErrors === "analytics" || _config.logErrors === "firebase") {
      // init hook
      this._setupHookOnError();

      this.hookOnError((_msg, v1, v2, v3, error) => {
        if (this.analyticsHandler) {
          this.logEvent(
            // @ts-ignore
            "Error",
            undefined,
            error
              ? {
                  msg: _msg as string,
                }
              : undefined,
          );
        }
      });

      this.hookOnPromiseRejection((ev) => {
        if (this.analyticsHandler) {
          this.logEvent(
            // @ts-ignore
            "PromiseReject",
            undefined,
            {
              reason: typeof ev.reason === "string" ? ev.reason : undefined,
              msg: (ev.reason as unknown as Error).message
                ? (ev.reason as unknown as Error).message
                : undefined,
            },
          );
        }
      });
    } else if (_config.logErrors === "sentry") {
      console.warn('`config.logErrors === "sentry"` is not yet implemented');
    }
    if (_config.loadingScreenComponent) {
      const loadingScrObject = (this.loadingScreenObject = new GameObject());
      loadingScrObject.addComponent(_config.loadingScreenComponent);
      loadingScrObject.zIndex = Number.MAX_SAFE_INTEGER;
      this.stage.addChild(loadingScrObject);
    }
    await this.renderManager.initializeRenderer(_config);
    this.renderManager.init(this, _config);
    if (_config.autoResize !== "none") this.hookResize();

    const savers: Saver[] = [new LocalStorageSaver(_config.saveKeyPrefix)];
    this.platformSdk = Engine.createPlatformSDK(_config.gamePlatform);
    this.analyticsHandler = new AnalyticsHandler([..._config.analytics]);

    try {
      await this.platformSdk.initialize();
    } catch (err) {
      console.error("Platform SDK failed to initialize", err);
    }

    // Must come after the platform SDK exists, since the callbacks are registered on it
    if (_config.pauseOnFocusLoss) {
      // Only resume if the game was running when focus was lost,
      // so we never start a ticker the game hasn't started itself
      let resumeOnFocus = false;
      this.platformSdk.addOnPauseCallback(() => {
        if (!this.ticker.started || this._paused) return;
        this.pause();
        resumeOnFocus = true;
      });
      this.platformSdk.addOnResumeCallback(() => {
        if (!resumeOnFocus) return;
        resumeOnFocus = false;
        this.resume();
      });
    }

    if (_config.autoInitAnalytics) {
      this.analyticsHandler.initialize();
    }
    this.saveHandler = new SaveHandler(savers);
    this.saveHandler.getLatestData = _config.getLatestData;
    this.saveHandler.autoSave = _config.autoSave;
    PlayerDataSingleton.initialize(
      _config.playerDataKeys,
      await this.saveHandler.load(_config.playerDataKeys),
    );
    this.saveHandler.allowedToSave = true;

    if (!_config.autoStart) {
      this.getTicker().stop();
    } else {
      this.getTicker().start();
    }

    this.platformSdk.setLoadingProgress(25);

    if (_config.showFPSTracker) {
      this.fpsDisplay = new Stats();
      this.fpsDisplay.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
      document.body.appendChild(this.fpsDisplay.dom);
    }

    if (ENGINE_DEBUG_MODE) {
      console.log(
        `
WhiskerWeb v%s

Engine: %O
Render mode: %s
Engine.ticker: %O
Engine.stateManager: %O
Engine.renderManager: %O
Engine.loader: %O

${LogoAscii}
`,
        __WWVERSION,
        this,
        this.renderManager.getRenderer() instanceof WebGLRenderer
          ? "WebGL"
          : "WebGPU",
        this.ticker,
        this.stateManager,
        this.renderManager,
        this.loader,
      );
    }
    Engine.hideFontPreload();

    if (ENGINE_DEBUG_MODE) {
      console.log("Loading boot assets %o", _config.bootAssets);
    }

    this.platformSdk.setLoadingProgress(42);

    const loadPromise = this.loadAssets(_config.bootAssets, (p) => {
      if (ENGINE_DEBUG_MODE) {
        console.log("BootAssets load progress %i", p);
      }
      this.platformSDK.setLoadingProgress(p);
      _onProgress?.(p);
    })
      .then(() => {
        // process spritesheets
        _config.bootAssets.forEach((e) => {
          if (this.hasPIXIResource(e.key)) {
            const asset = this.getPIXIResource(e.key);
            if (asset instanceof Spritesheet) {
              this.processSpritesheet(asset);
            }
          }
        });

        this.platformSdk.setLoadingProgress(50);
        if (ENGINE_DEBUG_MODE) {
          console.log("Successfully loaded bootassets");
        }
      })
      // changeState hides the loading screen afterwards when autoHideLoadingScreen is set
      .then(() => this.changeState(_initialState))
      .catch((err) => {
        // Fatal!
        console.error(err);
      });

    // this.DEFAULT_TEXTURE = Texture.from(DEFAULT_TEXTURE_B64);
    return Promise.allSettled([
      loadPromise,
      // HelperFunctions.waitForTruth(() => this.DEFAULT_TEXTURE.)
    ]);
  }

  /**
   * Loads the specified assets using the specified loaders.
   * Calls run one at a time (a call made during another waits for it).
   * Each loader retries a failed asset once; rejects (after everything else has loaded)
   * if any asset still failed.
   * @param _assets
   * @param _onProgress (optional) Callback for loading progress, 0 to 100
   */
  public loadAssets(
    _assets: Array<{ key: string; path: string; type: LoaderType }>,
    _onProgress?: (_prog: number) => void,
  ): Promise<void> {
    const previous = this._loadAssetsPromise || Promise.resolve();
    const current = previous
      .catch((): void => undefined)
      .then(() => this._loadAssetsNow(_assets, _onProgress));
    this._loadAssetsPromise = current;
    const clear = (): void => {
      if (this._loadAssetsPromise === current) this._loadAssetsPromise = null;
    };
    current.then(clear, clear);
    return current;
  }

  private async _loadAssetsNow(
    _assets: Array<{ key: string; path: string; type: LoaderType }>,
    _onProgress?: (_prog: number) => void,
  ): Promise<void> {
    const loaders: Partial<
      Record<LoaderType, PIXILoader | JSONLoader | WASMLoader>
    > = {};
    for (const asset of _assets) {
      if (!asset) continue;
      let loader: PIXILoader | JSONLoader | WASMLoader;
      switch (asset.type) {
        case LoaderType.PIXI:
          loader = this.loader;
          break;
        case LoaderType.JSON:
          loader = this.jsonLoader;
          break;
        case LoaderType.WASM:
          loader = this.wasmLoader;
          break;
        default:
          console.warn("Unknown asset type %s for %s", asset.type, asset.key);
          continue;
      }
      loader.add(asset.key, `./assets/${asset.path}`);
      loaders[asset.type] = loader;
    }

    // Each loader reports 0-100; overall progress is their average.
    // It also goes to the loading screen while that is visible.
    const report = (p: number): void => {
      if (this.isLoadingScreenVisible) this.setLoadingScreenProgress(p);
      _onProgress?.(p);
    };
    const used = Object.values(loaders);
    const progress = used.map(() => 0);
    const results = await Promise.all(
      used.map((loader, i) =>
        loader.load((p: number) => {
          progress[i] = p;
          report(progress.reduce((a, b) => a + b, 0) / progress.length);
        }),
      ),
    );
    if (used.length === 0) report(100);

    const failed: string[] = [];
    results.forEach((result) =>
      Object.keys(result || {}).forEach((key) => {
        if (!result[key].success) failed.push(key);
      }),
    );
    if (failed.length > 0) {
      throw new Error(`Failed to load assets: ${failed.join(", ")}`);
    }
    if (ENGINE_DEBUG_MODE) {
      console.log("Loaded %s", _assets.map((e) => e.key).join(", "));
    }
  }

  private static createPlatformSDK(
    _platform: TResolvedWhiskerConfig["gamePlatform"],
  ): PlatformSDK {
    if (_platform instanceof PlatformSDK) return _platform;
    if (typeof _platform === "function") return new _platform();
    if (_platform !== "offline") {
      // "capacitor" used to be built in; it's opt-in now, so the Capacitor plugins aren't always bundled
      throw new Error(
        `Unknown gamePlatform "${_platform}". For Capacitor, import { CapacitorSDK } from "whiskerweb/capacitor" ` +
          `and pass gamePlatform: CapacitorSDK (or an instance).`,
      );
    }
    return new DummySDK();
  }

  private static hideFontPreload(): void {
    const collection: HTMLCollection =
      document.getElementsByClassName("fontPreload");

    // tslint:disable-next-line:prefer-for-of
    for (let i: number = collection.length - 1; i >= 0; i--) {
      collection[i].parentNode.removeChild(collection[i]);
    }
  }

  private hookResize(): void {
    window.addEventListener("resize", () => this.onResize());
    this.onResize();
  }

  private _setupHookOnError(): void {
    // addEventListener rather than window.onerror/onunhandledrejection, so other handlers aren't replaced
    window.addEventListener(
      "unhandledrejection",
      (e: PromiseRejectionEvent) => {
        this._onPromiseRejectionFunctions.forEach((_f) => _f(e));
      },
    );
    window.addEventListener("error", (e: ErrorEvent) => {
      this._onErrorFunctions.forEach((_f) =>
        _f(e.message, e.filename, e.lineno, e.colno, e.error),
      );
    });
  }

  private readonly mainLoop: () => void = () => {
    this.deltaTime = this.ticker.deltaTime;
    if (this.fpsDisplay) this.fpsDisplay.begin();
    // tween.js's own clock (performance.now), the same one `tween.start()` uses by default
    updateTweens();
    this.stateManager.onStep();
    // The loading screen lives on the engine stage, outside every scene
    if (this.loadingScreenObject?.visible) {
      Scene.stepObject(this.loadingScreenObject, this.deltaTime);
    }
    if (!this._pauseRendering)
      this.renderManager.getRenderer().render(this.stage);
    if (this.fpsDisplay) this.fpsDisplay.end();
  };
}
