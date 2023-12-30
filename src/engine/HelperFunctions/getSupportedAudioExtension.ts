
export type AUDIO_EXTENSIONS = ".mp3" | ".ogg" | "";

let _cachedResult: AUDIO_EXTENSIONS = "";
export function getSupportedAudioFormat(): AUDIO_EXTENSIONS {
    if(_cachedResult) return _cachedResult;

    const audioElement = new Audio();

    if (audioElement.canPlayType("audio/mpeg")) {
        return ".mp3";
    } else if (audioElement.canPlayType("audio/ogg")) {
        return ".ogg";
    } else {
        return "";
    }
}