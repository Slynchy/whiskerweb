import { ENGINE_DEBUG_MODE } from "../Constants/Constants";

let _IS_WEBP_SUPPORTED: boolean | undefined = undefined;

export function isWebPSupported(): boolean {
    if (typeof _IS_WEBP_SUPPORTED !== 'undefined') return _IS_WEBP_SUPPORTED;
    try {
        const canvasElement: HTMLCanvasElement = document.createElement('canvas');
        const dataUrl: string =
            canvasElement.toDataURL('image/webp');
        _IS_WEBP_SUPPORTED = (dataUrl.indexOf('data:image/webp') === 0);
        if (_IS_WEBP_SUPPORTED && ENGINE_DEBUG_MODE) console.log('WebP supported');
        return _IS_WEBP_SUPPORTED;
    } catch (err) {
        if (_IS_WEBP_SUPPORTED && ENGINE_DEBUG_MODE)
            console.log('WebP unsupported');
        return false;
    }
}
