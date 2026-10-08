import { BaseAnalytics } from "./BaseAnalytics";
import * as GAModule from "gameanalytics";
import { __WWVERSION } from "../Constants/Version";

type GAStatic = typeof GAModule.GameAnalytics;

// gameanalytics 5's ES module build only exports the SDK inside its `gameanalytics` namespace (a named
// `GameAnalytics` import fails to bundle), while its CommonJS build exports that namespace itself; this works with both
const GA: GAStatic = (
    (GAModule as unknown as { gameanalytics?: { GameAnalytics: GAStatic } }).gameanalytics
    ?? (GAModule as unknown as { GameAnalytics: GAStatic })
).GameAnalytics;

export interface IGameAnalyticsOptions {
    /** Game key, from the game's settings on the GameAnalytics dashboard */
    gameKey: string;
    /** Secret key, from the game's settings on the GameAnalytics dashboard */
    secretKey: string;
    /** Build version sent with every event; pass your game's version. Default: the whiskerweb version */
    build?: string;
    /** Log SDK info messages to the console. Default false */
    infoLog?: boolean;
    /** Log every event sent to the console. Default false */
    verboseLog?: boolean;
    /** Custom user ID, instead of the one the SDK generates and stores. Default: none */
    userId?: string;
    /**
     * Whether events are sent. Pass false to hold them back (e.g. until the player consents),
     * then call `GameAnalytics.sdk.setEnabledEventSubmission(true)`. Default true
     */
    eventSubmission?: boolean;
}

/**
 * Analytics module that sends events to GameAnalytics as design events.
 * Pass it to the engine in config `analytics`; the engine calls initialize() during init (config `autoInitAnalytics`).
 */
export class GameAnalytics extends BaseAnalytics {
    /**
     * The GameAnalytics SDK's static API (gameanalytics 5), for events and settings this module doesn't wrap
     * (business, progression and resource events, remote configs, etc.)
     */
    public static readonly sdk: GAStatic = GA;

    private readonly _options: IGameAnalyticsOptions;
    private _initialized: boolean = false;

    constructor(_options: IGameAnalyticsOptions) {
        super();
        if (!_options || !_options.gameKey || !_options.secretKey)
            throw new Error("GameAnalytics needs a gameKey and secretKey");
        this._options = { ..._options };
    }

    public logEvent(
        eventName: string, valueToSum?: number, parameters?: { [key: string]: string; }
    ): void {
        GA.addDesignEvent(
            eventName,
            valueToSum,
            parameters
        );
    }

    initialize(): void {
        if (this._initialized) return;
        this._initialized = true;

        const options = this._options;
        if (options.infoLog) {
            GA.setEnabledInfoLog(true);
        }
        if (options.verboseLog) {
            GA.setEnabledVerboseLog(true);
        }
        GA.configureBuild(options.build || __WWVERSION);
        if (options.userId) {
            GA.configureUserId(options.userId);
        }
        if (options.eventSubmission === false) {
            GA.setEnabledEventSubmission(false);
        }
        GA.initialize(options.gameKey, options.secretKey);
    }
}
