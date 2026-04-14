export class SeededRandom {
    private state: number;

    constructor(seed: number = 42) {
        this.state = seed >>> 0;
    }

    next(): number {
        this.state = (1664525 * this.state + 1013904223) >>> 0;
        return this.state / 0x100000000;
    }

    int(maxExclusive: number): number {
        if (maxExclusive <= 0) {
            return 0;
        }
        return Math.floor(this.next() * maxExclusive);
    }

    choice<T>(items: T[]): T {
        return items[this.int(items.length)];
    }
}
