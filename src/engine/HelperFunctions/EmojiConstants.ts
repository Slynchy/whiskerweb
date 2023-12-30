import { HelperFunctions } from "../HelperFunctions";

export function getRandomEmojiFromType(type: EMOJI_TYPE): EMOJI_UNICODE {
    const enumToUse = type === EMOJI_TYPE.POSITIVE ? EMOJI_UNICODE_POSITIVE : EMOJI_UNICODE_NEGATIVE;
    const keys = HelperFunctions.enumKeys(enumToUse);
    const randomIndex = Math.floor(Math.random() * (keys.length - 1));
    return enumToUse[keys[randomIndex]] as EMOJI_UNICODE;
}

export enum EMOJI_UNICODE_POSITIVE {
    GRIN = "\uD83D\uDE01",
    SUNGLASSES = "\uD83D\uDE0E",
    KISS_HEART = "\uD83D\uDE18",
    HEART_EYES = "\uD83D\uDE0D",
    CROSS_EYE_LAUGHING = "\uD83D\uDE06",
    NERDY = "\uD83E\uDD13",
    NUM_OF_EMOJI = 6
}

export enum EMOJI_UNICODE_NEGATIVE {
    // ANGRY = "\uD83D\uDE21",
    FLUSHED = "\uD83D\uDE33",
    GASP = "\uD83D\uDE27",
    DISTRESSED = "\uD83D\uDE16",
    HUFFNPUFF = "\uD83D\uDE24",
    NUM_OF_EMOJI = 4
}

export type EMOJI_UNICODE = EMOJI_UNICODE_POSITIVE & EMOJI_UNICODE_NEGATIVE;

export enum EMOJI_TYPE {
    POSITIVE,
    NEGATIVE,
}
