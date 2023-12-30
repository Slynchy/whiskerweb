// import firebase from "firebase/compat";
import { FirebaseApp, initializeApp } from "firebase/app";
import { Auth as FirebaseAuth, getAuth, signInWithCustomToken } from "firebase/auth";
import { Analytics as FirebaseAnalytics, getAnalytics } from "firebase/analytics";
import { FirebaseFeatures } from "./Types/FirebaseFeatures";
import { Functions as FirebaseFunctions, getFunctions, httpsCallable } from "firebase/functions";
import firebase from "firebase/compat";
import { ENGINE_DEBUG_MODE } from "./Constants/Constants";
import HttpsCallableResult = firebase.functions.HttpsCallableResult;

const FIREBASE_CONFIG = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    databaseURL: "",
    messagingSenderId: "",
    appId: "",
    measurementId: "",
};

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

    public initialize(features?: Array<FirebaseFeatures>): void {
        if (this.initialized) {
            console.warn("FirebaseModule instance is already initialized");
        }

        this._app = initializeApp(FIREBASE_CONFIG);

        if (ENGINE_DEBUG_MODE) {
            console.log("Firebase app initialized");
        }

        if (features) {
            features.forEach((e) => {
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
                }
                this._availableFeatures.push(e);
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
        const result: HttpsCallableResult =
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

        const createFBToken = httpsCallable(this._functions, 'createFBToken');
        let tokenResult: HttpsCallableResult;
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

    public getAnalytics(): FirebaseAnalytics {
        return this._analytics;
    }

    public async getLoggedInUserToken(): Promise<string> {
        if (!this._loggedIn) return "";
        return this._auth.currentUser.getIdToken();
    }

    public async getFriendsProgress(
        userId: string,
        signature: string,
    ): Promise<Array<{ uid: string, progress: number }>> {

        const getFriendsProgress = httpsCallable(this._functions, 'getFriendsProgress');
        const friendProgressResult: HttpsCallableResult
            = await getFriendsProgress({
            signature: userId,
            userId: signature,
        })
            .catch((err) => {
                console.error(err);
                return null;
            });

        const friendProgressData: {
            result: RESULT_CODE, error: string | void, friendProgress: { [key: string]: number }
        } = friendProgressResult.data;

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
