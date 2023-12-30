import { Languages, Locales } from "../engine/Constants/Locales";
import { ENGINE_DEBUG_MODE } from "../engine/Constants/Constants";
import isMobile from "is-mobile";

let _CURRENT_LOCALIZATION_LANGUAGE = Languages.English;

const TAP_CLICK_STR = isMobile() ? "Tap" : "Click";

export enum LOCALIZATION_KEYS {
    "PLACEHOLDER",
}

export const LOCALIZATIONS: { [key in Languages]: { [key in LOCALIZATION_KEYS]: string } } = {
    [Languages.English]: {
        [LOCALIZATION_KEYS.PLACEHOLDER]: "PLACEHOLDER",
    },
    [Languages.Japanese]: {
        [LOCALIZATION_KEYS.PLACEHOLDER]: "PLACEHOLDER",
    },
};

export function setLanguageFromLocale(_localeStr: string): void {
    const localeStr = _localeStr.toLowerCase();
    const languageKeys = Object.keys(Locales);
    for (let i = 0; i < languageKeys.length; i++) {
        const languageKey: Languages = languageKeys[i] as unknown as Languages;
        for (let v = 0; v < Locales[languageKey].length; v++) {
            const key = Locales[languageKey][v];
            if (key.toLowerCase() === localeStr) {
                _CURRENT_LOCALIZATION_LANGUAGE = parseInt(languageKeys[i]) as unknown as Languages;
                if (ENGINE_DEBUG_MODE) {
                    console.log("Setting locale to " + _localeStr);
                }
                return;
            }
        }
    }
    console.warn("Failed to set locale to " + _localeStr);
}

export function getCurrentLanguage(): Languages {
    return _CURRENT_LOCALIZATION_LANGUAGE;
}

export function getLText(key: LOCALIZATION_KEYS): string {
    return LOCALIZATIONS[_CURRENT_LOCALIZATION_LANGUAGE][key];
}
