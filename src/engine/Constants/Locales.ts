export enum Languages {
    English,
    Japanese,
}

type LocaleString = string; // e.g. `en_GB`

export const Locales: { [key in Languages]: LocaleString[] } = {
    [Languages.English]: [
        "en_GB",
        "en_US"
    ],
    [Languages.Japanese]: [
        "ja_JP",
    ],
};
