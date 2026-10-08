import { FirebaseApp, FirebaseOptions, initializeApp } from "firebase/app";
import { Auth as FirebaseAuth, getAuth, signInWithCustomToken } from "firebase/auth";
import { Analytics as FirebaseAnalytics, getAnalytics } from "firebase/analytics";
import { FirebaseFeatures } from "./Types/FirebaseFeatures";
import { Functions as FirebaseFunctions, getFunctions, httpsCallable } from "firebase/functions";
// Type-only, from the modular SDK: importing firebase/compat/app here would bundle the whole compat layer
import type { HttpsCallableResult } from "firebase/functions";
import { ENGINE_DEBUG_MODE } from "./Constants/Constants";

enum RESULT_CODE {
    SUCCESS = 0,
    FAILURE,
    SIGNATURE_INVALID,
    MISSING_TEXT,
    ERROR,
    EXPIRED,
    USERID_INVALID,
    REVOKED,
}

class FirebaseModule {

    private _app: FirebaseApp = null;
    private _analytics: FirebaseAnalytics = null;
    private _auth: FirebaseAuth = null;
    private _functions: FirebaseFunctions = null;
    private _availableFeatures: Array<FirebaseFeatures> = [];
    private _loggedIn: boolean = false;

    constructor() {
    }

    private _firebaseUserId: string = "";

    public get firebaseUserId(): string {
        return this._firebaseUserId;
    }

    private _initialized: boolean = false;

    public get initialized(): boolean {
        return this._initialized;
    }

    public isLoggedIn(): boolean {
        return Boolean(this._loggedIn);
    }

    /**
     * Initializes the (default) Firebase app and the requested features. Call it once, before using the rest of
     * this API or constructing a FirebaseAnalytics module with `getAnalytics()`.
     * Throws if the app itself can't be initialized; a feature that fails to initialize (e.g. Analytics without an
     * `appId`, or without both `apiKey` and `measurementId`) is logged and left unavailable.
     * @param config The web app's Firebase config, from the Firebase console
     * @param features The features to initialize; `FirebaseFeatures.RTDB` is not supported and is ignored
     */
    public initialize(config: FirebaseOptions, features?: Array<FirebaseFeatures>): void {
        if (this.initialized) {
            console.warn("FirebaseModule instance is already initialized");
            return;
        }

        this._app = initializeApp(config);

        if (ENGINE_DEBUG_MODE) {
            console.log("Firebase app initialized");
        }

        if (features) {
            features.forEach((e) => {
                try {
                    switch (e) {
                        case FirebaseFeatures.Analytics:
                            this._analytics = getAnalytics(this._app);
                            break;
                        case FirebaseFeatures.Auth:
                            this._auth = getAuth(this._app);
                            break;
                        case FirebaseFeatures.Functions:
                            this._functions = getFunctions(this._app);
                            break;
                        default:
                            console.warn(`Firebase feature ${FirebaseFeatures[e] ?? e} is not supported; ignoring it`);
                            return;
                    }
                } catch (err) {
                    console.error(`Firebase feature ${FirebaseFeatures[e]} failed to initialize`, err);
                    return;
                }
                if (!this._supportsFeature(e)) {
                    this._availableFeatures.push(e);
                }
            });
        }

        this._initialized = true;
    }

    public async setProgressOnFirebase(
        _userId: string,
        _userToken: string,
        _progress: number,
    ): Promise<void> {
        if (!this._supportsFeature(FirebaseFeatures.Functions)) {
            return Promise.reject(new Error("Cannot register; functions feature not available/initialized!"));
        }

        const updateUserProgress = httpsCallable(this._functions, 'updateUserProgress');
        const result: HttpsCallableResult<unknown> =
            await updateUserProgress({
                userId: _userId,
                userToken: _userToken,
                progress: _progress,
            })
                .catch((err) => {
                    console.error(err);
                    return null;
                });

        if (!result) {
            // handle error
        } else {
            if (ENGINE_DEBUG_MODE) {
                console.log(result);
            }
            return;
        }
    }

    /**
     * @deprecated Removed facebook support as of Pixi v8 upgrade
     * @param userId
     * @param signature
     */
    public async registerFirebaseWithFacebookSignature(userId: string, signature: string): Promise<string> {
        if (!this._supportsFeature(FirebaseFeatures.Functions)) {
            return Promise.reject(new Error("Cannot register; functions feature not available/initialized!"));
        }

        const createFBToken = httpsCallable<unknown, {
            result: RESULT_CODE, error: Error | void, token: string | void
        }>(this._functions, 'createFBToken');
        let tokenResult: HttpsCallableResult<{
            result: RESULT_CODE, error: Error | void, token: string | void
        }>;
        if (createFBToken) {
            tokenResult = await createFBToken({signature: signature, userId: userId})
                .catch((err) => {
                    console.error(err);
                    return null;
                });
        } else {
            return Promise.reject(new Error("Cannot register; function to register not found!"));
        }
        if (!tokenResult) {
            return Promise.reject(new Error("Cannot register; invalid result from token request!"));
        }
        const tokenData: {
            result: RESULT_CODE, error: Error | void, token: string | void
        } = tokenResult.data;
        if (!tokenData || !tokenData.token) {
            return Promise.reject(new Error("Cannot register; invalid token data!"));
        }
        if (tokenData.result !== RESULT_CODE.SUCCESS) {
            console.error(tokenData.error);
            return Promise.reject(new Error("Cannot register; result was not valid! " + tokenData.result));
        }
        return tokenData.token;
    }

    public async loginToFirebaseWithToken(token: string): Promise<void> {
        if (!this._supportsFeature(FirebaseFeatures.Auth)) {
            return Promise.reject(new Error("Cannot login; auth feature not available/initialized!"));
        }

        if (this._loggedIn) {
            return Promise.reject(new Error("Cannot login; already logged in"));
        }

        const credentials
            = await signInWithCustomToken(this._auth, token)
            .catch((err) => {
                console.error(err);
                return null;
            });

        if (!credentials) {
            return Promise.reject(new Error("Error encountered when logging in"));
        }

        this._firebaseUserId = credentials.user.uid;

        if (ENGINE_DEBUG_MODE) {
            console.log("Credentials: %o", credentials);
        }

        this._loggedIn = true;
    }

    /**
     * The Firebase Analytics instance, for `new FirebaseAnalytics(...)`;
     * null unless `initialize` was called with `FirebaseFeatures.Analytics` and it initialized successfully
     */
    public getAnalytics(): FirebaseAnalytics {
        return this._analytics;
    }

    public async getLoggedInUserToken(): Promise<string> {
        if (!this._loggedIn) return "";
        return this._auth.currentUser.getIdToken();
    }

    /**
     * Resolves with an empty array if the request fails; rejects if the Functions feature isn't initialized
     * @param userId
     * @param signature
     */
    public async getFriendsProgress(
        userId: string,
        signature: string,
    ): Promise<Array<{ uid: string, progress: number }>> {
        if (!this._supportsFeature(FirebaseFeatures.Functions)) {
            return Promise.reject(new Error("Cannot get friends' progress; functions feature not available/initialized!"));
        }

        const getFriendsProgress = httpsCallable<unknown, {
            result: RESULT_CODE, error: string | void, friendProgress: { [key: string]: number }
        }>(this._functions, 'getFriendsProgress');
        const friendProgressResult
            = await getFriendsProgress({
            signature: signature,
            userId: userId,
        })
            .catch((err) => {
                console.error(err);
                return null;
            });

        // null when the request failed (e.g. network error)
        const friendProgressData = friendProgressResult ? friendProgressResult.data : null;

        if (friendProgressData && friendProgressData.friendProgress) {
            const keys = Object
                .keys(friendProgressData.friendProgress)
                .filter(
                    (e) => Object.prototype.hasOwnProperty.call(
                        friendProgressData.friendProgress, e
                    ));
            const res = keys.map((e) => {
                return {uid: e, progress: friendProgressData.friendProgress[e]};
            });
            return res;
        } else {
            return [];
        }
    }

    private _supportsFeature(feature: FirebaseFeatures): boolean {
        return this._availableFeatures.indexOf(feature) !== -1;
    }
}

export const FirebaseSingleton: FirebaseModule = new FirebaseModule();
