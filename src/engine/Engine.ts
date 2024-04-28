import { StateManager } from "./StateManager";
import { State } from "./State";
import {
    Container,
    Spritesheet,
    Texture as PIXITexture,
    Ticker as PIXITicker,
    SCALE_MODE, WebGLRenderer, Texture
} from "pixi.js";
import { RenderManager } from "./RenderManager";
import { PIXILoader } from "./Loaders/PIXILoader";
import { TWhiskerConfig } from "../config/whiskerConfig";
import {
    __WWVERSION,
    ENGINE_DEBUG_MODE,
    LOADTIME_DEBUG_MODE
} from "./Constants/Constants";
import { ENGINE_ERROR } from "./ErrorCodes/EngineErrorCodes";
import * as TWEEN from '@tweenjs/tween.js';
import { PlatformSDK } from "./PlatformSDKs/PlatformSDK";
import { DummySDK } from "./PlatformSDKs/DummySDK";
import { SaveHandler } from "./Savers/SaveHandler";
import { LocalStorageSaver } from "./Savers/LocalStorageSaver";
import { Saver } from "./Savers/Saver";
import { AnalyticsHandler } from "./Analytics/AnalyticsHandler";
import { BaseAnalytics } from "./Analytics/BaseAnalytics";
import { FirebaseAnalytics } from "./Analytics/FirebaseAnalytics";
import { LoadtimeMeasurer } from "./Debug/LoadtimeMeasurer";
import { GameObject } from "./GameObject";
import { HelperFunctions } from "./HelperFunctions";
import { FirebaseSingleton } from "./FirebaseSingleton";
import { FirebaseFeatures } from "./Types/FirebaseFeatures";
import { PlayerDataSingleton } from "./PlayerDataSingleton";
import { AdIDs } from "./Constants/AdIDs";
import { LoaderType } from "./Loaders/LoaderType";
import { AdPlacements } from "./Types/AdPlacements";
import isMobile from "is-mobile";
import { JSONLoader } from "./Loaders/JSONLoader";
import { WASMLoader } from "./Loaders/WASMLoader";
import { GameAnalytics } from "./Analytics/GameAnalytics";
import {CapacitorSDK} from "./PlatformSDKs/CapacitorSDK";
import { LogoAscii } from "../config/ascii";
import InputManager from "./InputManager";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Stats = require('stats.js');

declare global {
    const ENGINE: Engine;
    // const _PAGE_START_TIME: number;
}

let _INITIAL_LOAD_TIME: number = -1;

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
    private _onPromiseRejectionFunctions: Array<(ev: PromiseRejectionEvent) => void> = [];
    private _loadAssetsPromise: Promise<void>;
    private _adjustHeightForBannerAd: boolean = false;

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
        if(ENGINE_DEBUG_MODE) {
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
        return this.loader.isAssetLoaded(_key) ||
            false;
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
     */
    public getTexture(_key: string): PIXITexture {
        return this.loader.has(_key) ? this.loader.get(_key) : (console.warn("Failed to find texture %s", _key) as unknown as boolean && Texture.WHITE) as Texture;
    }

    /**
     * Sets the scale mode for the renderer
     * @deprecated Not yet implemented as of PIXI v8 upgrade
     * @param scaleMode "nearest" or "linear"
     */
    public setScaleMode(scaleMode: SCALE_MODE): void {
        console.warn("setScaleMode not working as of pixi v8 upgrade");
    }

    /**
     * Returns true if any loaders are loading
     */
    public isLoaderLoading(): boolean {
        return this.loader.isLoading || this.jsonLoader.isLoading || this.wasmLoader.isLoading;
    }

    /**
     * Initializes the Firebase analytics module with the analytics handler
     */
    public initializeFirebaseAnalytics(): void {
        this.analyticsHandler.addModule(
            new FirebaseAnalytics(FirebaseSingleton.getAnalytics())
        );
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
        if(
            !isMobile()
            // || PlayerDataSingleton.isVibrationDisabled()
        ) return Promise.resolve(false);
        else {
            return this.platformSDK.requestHapticFeedbackAsync();
        }
    }

    /**
     * Tracks the initial load time of the game
     * @deprecated Not currently working
     */
    public trackInitialLoadTime(): Promise<void> {
        throw new Error("Not currently working");

        if (_INITIAL_LOAD_TIME === -1) {
            const done = () => {
                _INITIAL_LOAD_TIME = Date.now();// - _PAGE_START_TIME;
                // this.logEvent(
                //     "SHLoadTime",
                //     _INITIAL_LOAD_TIME,
                // );
                console.log(`Loadtime was ` + _INITIAL_LOAD_TIME + `ms`);

                // fixme: HACK!
                if(this.platformSDK.isAdsSupported()) {
                    this.platformSDK.showBannerAd(
                        AdIDs[AdPlacements.BANNER]
                    ).catch((err) => console.error(err));
                }
            };
            this.platformSDK.setLoadingProgress(100);
            return this.platformSDK.startGame().then(() => done()).catch(() => done());
        } else {
            if(this.platformSDK.isAdsSupported()) {
                this.platformSDK.showBannerAd(
                    AdIDs[AdPlacements.BANNER]
                ).catch((err) => console.error(err));
            }
            return Promise.resolve();
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
    public hookOnPromiseRejection(_func: (ev: PromiseRejectionEvent) => void): void {
        this._onPromiseRejectionFunctions.push(_func);
    }

    /**
     * Resizes the renderer to the specified width and height
     * For people who know what they're doing, otherwise use `autoResize`
     * @param _w
     * @param _h
     * @param _autoResizeVal
     */
    public resizeRenderer(_w: number, _h: number, _autoResizeVal?: TAutoResize): void {
        if(_autoResizeVal === "either") {
            this.autoResize =
                this.renderManager.height > this.renderManager.width ?
                    "height" : "width";
        }
        RenderManager.configureRenderer2d(
            _w,
            _h,
            this, this.renderManager.getRenderer()
        );
        if(ENGINE_DEBUG_MODE) {
            this.renderManager.createDebugGrid();
        }
    }

    /**
     * Unloads the current state and loads the specified state
     * @param _newState
     * @param _params Parameters to pass to the new state
     */
    public changeState(_newState: State, _params?: unknown): Promise<void> {
        return this.stateManager.setState(_newState, _params);
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
        let exists = this.loader.has(key);
        let target = exists ? this.loader.get(key) : null;
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
        return (tex && tex.texture ? tex.texture : tex);
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
     * Unloads the specified asset from the PIXI loader cache
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
            if(!_force) {
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
        this.resizeRenderer(
            window.innerWidth,
            window.innerHeight,
            this.autoResize
        );
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
    public logEvent(eventName: string, valueToSum?: number, parameters?: { [key: string]: string; }): void {
        parameters = parameters || {};
        return this.analyticsHandler.logEvent(
            eventName,
            valueToSum || undefined,
            {
                version: __WWVERSION,
                ...parameters
            }
        );
    }

    /**
     * Main initialization function for the engine
     * @param _initialState State to load into
     * @param _config Configuration object for engine
     * @param _onProgress (optional) Callback for loading progress
     */
    public async init(
        _initialState: State,
        _config: TWhiskerConfig,
        _onProgress?: (_val: number) => void
    ): Promise<unknown> {
        await this.inputManager.initialize();
        this._adjustHeightForBannerAd = _config.adjustHeightForBannerAd || false;
        this.pauseOnFocusLoss = _config.pauseOnFocusLoss || false;
        this.setScaleMode(_config.scaleMode);
        if(_config.autoResize === "either") {
            this.autoResize =
                _config.height > _config.width ?
                    "height" : "width";
        }

        // init firebase
        if (_config.autoInitFirebase) {
            FirebaseSingleton.initialize([
                FirebaseFeatures.Auth,
                FirebaseFeatures.Analytics,
                FirebaseFeatures.Functions,
            ]);
            this.initializeFirebaseAnalytics();
        }
        if (_config.logErrors === "firebase") {
            // init hook
            this._setupHookOnError();

            this.hookOnError((
                _msg,
                v1,
                v2,
                v3,
                error
            ) => {
                if (this.analyticsHandler) {
                    this.logEvent(
                        // @ts-ignore
                        "Error",
                        undefined, error ? {
                            msg: _msg as string
                        } : undefined);
                }
            });

            this.hookOnPromiseRejection((ev) => {
                if (this.analyticsHandler) {
                    this.logEvent(
                        // @ts-ignore
                        "PromiseReject",
                        undefined, {
                            reason: typeof ev.reason === "string" ? ev.reason : undefined,
                            msg: (ev.reason as unknown as Error).message ? (ev.reason as unknown as Error).message : undefined,
                        });
                }
            });
        } else if (_config.logErrors === "sentry") {
            console.warn("`config.logErrors === \"sentry\"` is not yet implemented");
        }
        if(_config.loadingScreenComponent) {
            const loadingScrObject = this.loadingScreenObject = new GameObject();
            loadingScrObject.addComponent(_config.loadingScreenComponent);
            loadingScrObject.zIndex = Number.MAX_SAFE_INTEGER;
            this.stage.addChild(loadingScrObject);
        }
        await this.renderManager.initializeRenderer(_config);
        this.renderManager.init(this, _config);
        if (_config.autoResize !== "none")
            this.hookResize();

        if(_config.pauseOnFocusLoss) {
            let focusLost = false;
            ENGINE.platformSDK.addOnPauseCallback(() => {
                ENGINE.getTicker().stop();
                focusLost = true;
            });
            ENGINE.platformSDK.addOnResumeCallback(() => {
                if(focusLost) return;
                ENGINE.getTicker().start();
            });
        }

        const analyticsModules: BaseAnalytics[] = [];
        const savers: Saver[] = [];
        if(typeof _config.gamePlatform === "string") {
            switch (_config.gamePlatform) {
                case "capacitor":
                    savers.push(new LocalStorageSaver());
                    this.platformSdk = new CapacitorSDK();
                    analyticsModules.push(new GameAnalytics());
                    break;
                case "offline":
                default:
                    savers.push(new LocalStorageSaver());
                    this.platformSdk = new DummySDK();
                    analyticsModules.push(new GameAnalytics());
                    break;
            }
        } else {
            savers.push(
              // @ts-ignore
              new _config.gamePlatform());
        }
        this.analyticsHandler = new AnalyticsHandler(
            analyticsModules
        );
        if(_config.autoInitAnalytics) {
            this.analyticsHandler.initialize();
        }
        this.saveHandler = new SaveHandler(
            savers
        );
        if(_config.getLatestData) {
            this.saveHandler.getLatestData = _config.getLatestData;
        }
        this.saveHandler.autoSave = _config.autoSave || -1;
        PlayerDataSingleton.initialize(
            _config.playerDataKeys,
            await this.saveHandler.load(_config.playerDataKeys)
        );
        this.saveHandler.allowedToSave = true;

        if (!_config.autoStart) {
            this.getTicker().stop();
        } else {
            this.getTicker().start();
        }
        if(_config.autoInitAnalytics) {
            this.initializeAnalytics();
        }

        this.platformSdk.setLoadingProgress(25);

        if (_config.showFPSTracker) {
            this.fpsDisplay = new Stats();
            this.fpsDisplay.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
            document.body.appendChild(this.fpsDisplay.dom);
        }

        if (ENGINE_DEBUG_MODE) {
            console.log(`
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
                this.renderManager.getRenderer() instanceof WebGLRenderer ?
                    "WebGL" : "WebGPU",
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

        const loadPromise = this.loadAssets(
            _config.bootAssets,
            (p) => {
                if(ENGINE_DEBUG_MODE) {
                    console.log("BootAssets load progress %i", p);
                }
                this.platformSDK.setLoadingProgress(p);
                _onProgress ? _onProgress(p) : null;
            }
        )
            .then(() => {
                // process spritesheets
                _config.bootAssets.forEach((e) => {
                    if(this.hasPIXIResource(e.key)) {
                        const asset = this.getPIXIResource(e.key);
                        if(asset instanceof Spritesheet) {
                            this.processSpritesheet(
                                asset
                            );
                        }
                    }
                });

                this.platformSdk.setLoadingProgress(50);
                if (ENGINE_DEBUG_MODE) {
                    console.log("Successfully loaded bootassets");
                }
            })
            .then(() => this.changeState(_initialState))
            .then(() => (_config.autoHideLoadingScreen &&
                this.loadingScreenObject) ? (this.loadingScreenObject.visible = false) : null)
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
     * Loads the specified assets using the specified loaders
     * @param _assets
     * @param _onProgress (optional) Callback for loading progress
     */
    public loadAssets(_assets: Array<{key: string, path: string, type: LoaderType}>, _onProgress?: (_prog: number) => void): Promise<void> {
        if(this._loadAssetsPromise) {
            return this._loadAssetsPromise.then(() => this.loadAssets(_assets, _onProgress));
        }
        return this._loadAssetsPromise = new Promise<void>((_resolve: () => void, _reject: (err: unknown) => void): void => {
            const progress = [0, 0, 0];
            const onProgress = (e: number) => {
                return _onProgress ? _onProgress((progress[0] + progress[1] + progress[2]) / 3) : null;
            };

            for (const k in _assets) {
                if (!Object.prototype.hasOwnProperty.call(_assets, k)) continue;
                if (_assets[k]) {
                    switch (_assets[k].type) {
                        case LoaderType.PIXI:
                            this.loader.add(_assets[k].key, `./assets/${_assets[k].path}`);
                            break;
                        case LoaderType.JSON:
                            this.jsonLoader.add(_assets[k].key, `./assets/${_assets[k].path}`);
                            break;
                        case LoaderType.WASM:
                            this.wasmLoader.add(_assets[k].key, `./assets/${_assets[k].path}`);
                            break;
                    }
                }
            }

            Promise.allSettled([
                this.loader.load((e) => onProgress(progress[0] = e))
                    .catch(async () => {
                        // todo: add proper retry
                        try {
                            await this.loader.load();
                            this._loadAssetsPromise = null;
                            _resolve();
                        } catch (err) {
                            this._loadAssetsPromise = null;
                            _reject(err);
                        }
                    }),
                this.jsonLoader.load((e) => onProgress(progress[1] = e))
                    .catch(async () => {
                        // todo: add proper retry
                        try {
                            await this.jsonLoader.load();
                            this._loadAssetsPromise = null;
                            _resolve();
                        } catch (err) {
                            this._loadAssetsPromise = null;
                            _reject(err);
                        }
                    }),
                this.wasmLoader.load((e) => onProgress(progress[2] = e))
                    .catch(async () => {
                        // todo: add proper retry
                        try {
                            await this.wasmLoader.load();
                            this._loadAssetsPromise = null;
                            _resolve();
                        } catch (err) {
                            this._loadAssetsPromise = null;
                            _reject(err);
                        }
                    }),
            ]).then(() => {
                this._loadAssetsPromise = null;
                if(ENGINE_DEBUG_MODE) {
                    console.log("Loaded %s", _assets
                        .map((e) => e.key)
                        .join(", ")
                    );
                }
                _resolve();
            }).catch(_reject);

        });
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
        window.addEventListener('resize', () => this.onResize());
        this.onResize();
    }

    private _setupHookOnError(): void {
        window.onunhandledrejection = (
            e: PromiseRejectionEvent
        ) => {
            this._onPromiseRejectionFunctions.forEach((_f) => _f(e));
        };
        window.onerror = (
            _msg,
            _url,
            _lineNo,
            _columnNo,
            _error
        ) => {
            this._onErrorFunctions.forEach((_f) => _f(
                _msg,
                _url,
                _lineNo,
                _columnNo,
                _error
            ));
        };
    }

    private readonly mainLoop: () => void = () => {
        this.deltaTime = this.ticker.deltaTime;
        if (this.fpsDisplay)
            this.fpsDisplay.begin();
        TWEEN.update(Date.now());
        this.stateManager.onStep();
        if (!this._pauseRendering)
            this.renderManager.getRenderer().render(this.stage);
        if (this.fpsDisplay)
            this.fpsDisplay.end();
    };
}
