
export type AUDIO_EXTENSIONS = ".mp3" | ".ogg" | "";

// null until the first call; "" is a valid (cacheable) result meaning neither format is supported
let _cachedResult: AUDIO_EXTENSIONS | null = null;
export function getSupportedAudioFormat(): AUDIO_EXTENSIONS {
    if(_cachedResult !== null) return _cachedResult;

    const audioElement = new Audio();

    if (audioElement.canPlayType("audio/mpeg")) {
        _cachedResult = ".mp3";
    } else if (audioElement.canPlayType("audio/ogg")) {
        _cachedResult = ".ogg";
    } else {
        _cachedResult = "";
    }
    return _cachedResult;
}