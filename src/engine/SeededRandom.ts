export class SeededRandom {
    private seed: number;
    private m = 0x80000000; // 2**31
    private a = 1103515245;
    private c = 12345;

    constructor(seed: number) {
        this.seed = seed;
    }

    public next(): number {
        this.seed = (this.a * this.seed + this.c) % this.m;
        return this.seed / this.m;
    }
}