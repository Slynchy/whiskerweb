/**
 * Deterministic pseudo-random number generator (31-bit linear congruential generator).
 * The same seed always produces the same sequence of values in [0, 1).
 */
export class SeededRandom {
    private seed: number;
    private m = 0x80000000; // 2**31
    private a = 1103515245;
    private c = 12345;

    /**
     * @param seed Any number; it is truncated to an integer and reduced to a non-negative 31-bit value
     */
    constructor(seed: number) {
        // eslint-disable-next-line no-bitwise
        this.seed = (Math.trunc(seed) || 0) & 0x7fffffff;
    }

    /**
     * @returns The next value in the sequence, in [0, 1)
     */
    public next(): number {
        // Math.imul keeps the multiply exact (a * seed can exceed 2^53, losing the low bits),
        // and masking to 31 bits is the same as `% m` for a non-negative result
        // eslint-disable-next-line no-bitwise
        this.seed = (Math.imul(this.a, this.seed) + this.c) & 0x7fffffff;
        return this.seed / this.m;
    }
}
