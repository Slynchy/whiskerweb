import { LoaderType } from "./LoaderType";

export const FileExtToLoaderTypeMap: { [key: string]: LoaderType } = {
    // "fbx": LoaderType.FBX,
    // "gltf": LoaderType.GLTF,
    // "obj": LoaderType.OBJMTL,
    "json": LoaderType.JSON,
    "png": LoaderType.PIXI,
    "jpeg": LoaderType.PIXI,
    "jpg": LoaderType.PIXI,
};
