import { BaseAnalytics } from "./BaseAnalytics";
import { Analytics, logEvent as FBLogEvent } from "firebase/analytics";

/**
 * Analytics module that logs events to Firebase (Google) Analytics.
 * Construct it with `FirebaseSingleton.getAnalytics()` after `FirebaseSingleton.initialize(config, [FirebaseFeatures.Analytics])`,
 * and pass it to the engine in config `analytics`.
 */
export class FirebaseAnalytics extends BaseAnalytics {

    private readonly _analyticsInstance: Analytics;

    constructor(_firebaseAnalytics: Analytics) {
        super();
        if (!_firebaseAnalytics)
            throw new Error(
                "FirebaseAnalytics needs a Firebase Analytics instance; " +
                "call FirebaseSingleton.initialize(config, [FirebaseFeatures.Analytics]) first"
            );
        this._analyticsInstance = _firebaseAnalytics;
    }

    // Firebase Analytics starts collecting as soon as the instance is created
    public initialize(): void {}

    public logEvent(eventName: string, valueToSum?: number, parameters?: { [key: string]: string; }): void {
        FBLogEvent(this._analyticsInstance, eventName, {
            ...(valueToSum !== undefined ? { value: valueToSum } : {}),
            ...parameters
        });
    }
}
