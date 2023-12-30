import { StateManager } from "./StateManager";
import { State } from "./State";
import {
    Container,
    Spritesheet,
    Texture as PIXITexture,
    Ticker as PIXITicker,
    SCALE_MODE, WebGLRenderer
} from "pixi.js";
import { RenderManager } from "./RenderManager";
import { PIXILoader } from "./Loaders/PIXILoader";
import { TWhiskerConfig } from "../config/whiskerConfig";
import {
    __WWVERSION,
    DEFAULT_CAMERA_FOV,
    DEFAULT_TEXTURE_B64,
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
import { GameObject, HelperFunctions } from "../../index";
import { FirebaseSingleton } from "./FirebaseSingleton";
import { FirebaseFeatures } from "./Types/FirebaseFeatures";
import { isWebPSupported } from "./HelperFunctions/isWebPSupported";
import { PlayerDataSingleton } from "./PlayerDataSingleton";
import { AdIDs } from "./Constants/AdIDs";
import { LoaderType } from "./Loaders/LoaderType";
import { AdPlacements } from "./Types/AdPlacements";
// import { Camera, OrthographicCamera, PerspectiveCamera, Texture as ThreeTexture, WebGLRenderer } from "three";
import isMobile from "is-mobile";
// import { EffectComposer, Pass } from "three/examples/jsm/postprocessing/EffectComposer";
// import WEBGL from "three/examples/jsm/capabilities/WebGL";
import { JSONLoader } from "./Loaders/JSONLoader";
import { WASMLoader } from "./Loaders/WASMLoader";
import { GameAnalytics } from "./Analytics/GameAnalytics";
import {DEPRECATED_SCALE_MODES} from "pixi.js/lib/rendering/renderers/shared/texture/const";
import {CapacitorSDK} from "./PlatformSDKs/CapacitorSDK";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Stats = require('stats.js');

// const ENABLE_3D: boolean = false;

declare global {
    const ENGINE: Engine;
    // const _PAGE_START_TIME: number;
}

let _INITIAL_LOAD_TIME: number = -1;

export class Engine {

    // CONST PROPS
    // private readonly renderer3d: WebGLRenderer;
    // private readonly effectComposer: EffectComposer;
    // private readonly defaultCameraType: string;

    private readonly ticker: PIXITicker;
    private readonly stateManager: StateManager;
    private readonly loader: PIXILoader;
    private readonly jsonLoader: JSONLoader;
    private readonly wasmLoader: WASMLoader;
    private readonly renderManager: RenderManager;
    private readonly stage: Container;
    // private readonly defaultTexture: undefined;
    private saveHandler: SaveHandler;
    private analyticsHandler: AnalyticsHandler;
    private platformSdk: PlatformSDK;

    // DEBUG
    // @ts-ignore
    private fpsDisplay: Stats;
    private readonly loadtimeMeasurer: LoadtimeMeasurer;

    // RUNTIME PROPS
    // private renderPasses: Pass[] = [];
    // private mainCamera: Camera;
    public pauseOnFocusLoss: boolean = false;
    // private DEFAULT_TEXTURE: PIXITexture;
    private dt: number = 1;
    private _scaleFactor: number = 1;
    private _pauseRendering: boolean = false;
    private _onErrorFunctions: Array<typeof window.onerror> = [];
    private _onPromiseRejectionFunctions: Array<(ev: PromiseRejectionEvent) => void> = [];
    private _loadAssetsPromise: Promise<void>;
    private _autoResizeVal: "either" | "width" | "height" | "none";
    private _loadingScrObject: GameObject | null = null;
    private _adjustHeightForBannerAd: boolean = false;

    // todo: abstract tsthreeConfig
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

        this.loader = new PIXILoader();
        this.jsonLoader = new JSONLoader();
        this.wasmLoader = new WASMLoader();

        this.getTicker().add(this.mainLoop);

        // @ts-ignore
        window.ENGINE = this;
    }

    public initializeAnalytics(): void {
        this.analyticsHandler.initialize();
    }

    public getWASM<T>(_key: string): T | null {
        return this.wasmLoader.get(_key) || null;
    }

    public getTexture(_key: string): PIXITexture {
        return this.loader.has(_key) ? this.loader.get(_key) : null;
    }

    public setScaleMode(scaleMode: SCALE_MODE): void {
        console.warn("setScaleMode not working as of pixi v8 upgrade");
    }

    private _getPlayerDataSingleton(): typeof PlayerDataSingleton {
        if(ENGINE_DEBUG_MODE) {
            return PlayerDataSingleton;
        } else {
            return null;
        }
    }

    public isLoaderLoading(): boolean {
        return this.loader.isLoading;
    }

    public initializeFirebaseAnalytics(): void {
        this.analyticsHandler.addModule(
            new FirebaseAnalytics(FirebaseSingleton.getAnalytics())
        );
    }

    public getActiveState(): State {
        return this.stateManager.getState();
    }

    public requestHapticFeedback(): Promise<boolean> {
        if(
            !isMobile()
            // || PlayerDataSingleton.isVibrationDisabled()
        ) return Promise.resolve(false);
        else {
            return this.platformSDK.requestHapticFeedbackAsync();
        }
    }

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

    public hookOnError(_func: typeof window.onerror): void {
        this._onErrorFunctions.push(_func);
    }

    public hookOnPromiseRejection(_func: (ev: PromiseRejectionEvent) => void): void {
        this._onPromiseRejectionFunctions.push(_func);
    }

    public _setupHookOnError(): void {
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

    public get scaleFactor(): number {
        return this._scaleFactor;
    }

    public get platformSDK(): PlatformSDK {
        return this.platformSdk;
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

    public resizeRenderer(_w: number, _h: number, _autoResizeVal?: string): void {
        if(_autoResizeVal === "either") {
            this._autoResizeVal =
                this.renderManager.height > this.renderManager.width ?
                    "height" : "width";
        }
        RenderManager.configureRenderer2d(
            _w,
            _h,
            this, this.renderManager.getRenderer()
        );
    }

    get deltaTime(): number {
        return this.dt;
    }

    set deltaTime(dt: number) {
        this.dt = dt;
    }

    private static hideFontPreload(): void {
        const collection: HTMLCollection =
            document.getElementsByClassName("fontPreload");

        // tslint:disable-next-line:prefer-for-of
        for (let i: number = collection.length - 1; i >= 0; i--) {
            collection[i].parentNode.removeChild(collection[i]);
        }
    }

    public changeState(_newState: State, _params?: unknown): Promise<void> {
        return this.stateManager.setState(_newState, _params);
    }

    /**
     * Forces a frame render
     */
    public forceRender(): void {
        this.renderManager.getRenderer().render(this.stage);
    }

    public setMaxFPS(fps: number): void {
        this.ticker.maxFPS = fps;
    }

    public setBackgroundColor(_col: number, _alpha?: number): void {
        this.renderManager.getRenderer().background.color = _col;
        if (typeof _alpha !== "undefined") {
            this.renderManager.getRenderer().background.alpha = _alpha;
        }
    }

    public getTicker(): PIXITicker {
        return this.ticker;
    }

    public getStage(): Container {
        return this.stage;
    }

    public hasJSON(key: string): boolean {
        return this.jsonLoader.isAssetLoaded(key);
    }

    public getJSON<T extends object>(key: string): T {
        return this.jsonLoader.get(key);
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

    public cachePIXIResource(key: string, asset: any): void {
        this.loader.cache(key, asset);
    }

    public unloadPIXIResource(key: string): void {
        this.loader.unload(key);
    }

    /**
     *
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

    public getRenderManager(): RenderManager {
        return this.renderManager;
    }

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

    public isPIXIAssetLoaded(_key: string): boolean {
        return this.loader.isAssetLoaded(_key) ||
            false;
    }

    public async init(
        _initialState: State,
        _config: TWhiskerConfig,
        _onProgress?: (_val: number) => void
    ): Promise<unknown> {
        this._adjustHeightForBannerAd = _config.adjustHeightForBannerAd || false;
        this.pauseOnFocusLoss = _config.pauseOnFocusLoss || false;
        this.setScaleMode(_config.scaleMode);
        if(_config.autoResize === "either") {
            this._autoResizeVal =
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
            const loadingScrObject = this._loadingScrObject = new GameObject();
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

    /\\_____/\\
   /  o   o  \\
  ( ==  ^  == )
   )         (
  (           )
 ( (  )   (  ) )
(__(__)___(__)__)

Engine: %O
Render mode: %s
Engine.ticker: %O
Engine.stateManager: %O
Engine.renderManager: %O
Engine.loader: %O
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
                this._loadingScrObject) ? (this._loadingScrObject.visible = false) : null)
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

    public alertLoadtime(): void {
        if (LOADTIME_DEBUG_MODE) {
            alert(this.exportLoadtimeAsString());
        }
    }

    public exportLoadtimeAsString(): string {
        if (LOADTIME_DEBUG_MODE) {
            return this.loadtimeMeasurer.exportLoadtime();
        }
    }

    public onResize(): void {
        this.resizeRenderer(
            window.innerWidth,
            window.innerHeight,
            this._autoResizeVal
        );
        this.getActiveState()?.onResize?.(this);
    }

    private hookResize(): void {
        window.addEventListener('resize', this.onResize);
        this.onResize();
    }

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
