import { PlatformSDK } from "./PlatformSDK";
import { DEFAULT_TEXTURE_B64 } from "../Constants/Constants";
import { AD_TYPE } from "../Types/AdType";
import { PurchaseResult } from "../Types/PurchaseResult";
import { uid } from "../HelperFunctions/uid";
import { IPlatformFriend } from "../Types/IPlatformFriend";

/**
 * The "offline" platform (config `gamePlatform: "offline"`, the default).
 * Uses PlatformSDK's offline defaults, but simulates ads, in-app purchases, contexts, a friend and a test player,
 * so those game flows can be exercised in a browser: every ad "shows" instantly and every purchase succeeds.
 */
export class DummySDK extends PlatformSDK {

    private _contextId: string = null;

    constructor() {
        super();
    }

    public isIAPAvailable(): boolean {
        return true;
    }

    public isAdsSupported(): boolean {
        return true;
    }

    public getContextId(): string {
        return this._contextId;
    }

    public getPlayerId(): string {
        return "1234";
    }

    public getEntryPointAsync(): Promise<string> {
        return Promise.resolve("debug");
    }

    public switchContext(_id: string): Promise<boolean> {
        this._contextId = _id;
        return Promise.resolve(true);
    }

    public async getAdvertisementInstance(_type: AD_TYPE, _placementId: string): Promise<any> {
        return {
            loadAsync(): Promise<void> {
                return Promise.resolve();
            },
            showAsync(): Promise<void> {
                return Promise.resolve();
            }
        };
    }

    public getPlayerName(): string {
        return "TEST";
    }

    public getPlayerPicUrl(): string {
        return DEFAULT_TEXTURE_B64;
    }

    getFriends(): Promise<IPlatformFriend[]> {
        return Promise.resolve([
            {
                name: "Ricky",
                uid: "123454321234",
                photoUrl: DEFAULT_TEXTURE_B64
            }
        ]);
    }

    purchaseAsync(_productId: string): Promise<PurchaseResult> {
        console.log(`Buying product ${_productId}`);
        return Promise.resolve({
            paymentID: uid(),
            productID: _productId,
            purchaseTime: (Math.floor(Date.now() / 1000)).toString(),
            purchaseToken: uid(),
            signedRequest: uid()
        });
    }

}
