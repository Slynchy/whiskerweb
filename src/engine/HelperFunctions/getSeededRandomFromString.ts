import { SeededRandom } from "../SeededRandom";
import { stringHash } from "./stringHash";

export function getSeededRandomFromString(str: string): number {
    const seed = stringHash(str);
    const seededRandom = new SeededRandom(seed);
    return seededRandom.next();
}