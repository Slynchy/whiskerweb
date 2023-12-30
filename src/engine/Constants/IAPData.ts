import { Spritesheet, Texture } from "pixi.js";

export enum IAPProductID {

}

export const IAPNames: Record<IAPProductID, string> = {

};

export const IAPIcons: Record<IAPProductID, string> = {

};

export interface IClientCatalogEntry {
    productId: IAPProductID;
    footerTextureKey: string;
    productNameColor?: string;
}

export const MostPopularIAPInStore: IAPProductID | null = null;

export const IAPClientCatalogData: Array<IClientCatalogEntry> = [

];

export const getIAPIconTexture = (_id: IAPProductID): Texture => {
    const input = IAPIcons[_id];
    const boosterIconSplitString = input.split("/");
    if(boosterIconSplitString.length > 1) {
        const sprSheet = ENGINE.getPIXIResource(boosterIconSplitString[0]) as Spritesheet;
        if(sprSheet) {
            return (
                sprSheet
            ).textures[boosterIconSplitString[1]] || Texture.EMPTY;
        } else {
            return Texture.EMPTY;
        }
    } else {
        return ENGINE.getPIXIResource(
            boosterIconSplitString[0]
        ) as Texture || Texture.EMPTY;
    }
};

export const IAPContents: Record<IAPProductID, Record<string, number>> = {};
