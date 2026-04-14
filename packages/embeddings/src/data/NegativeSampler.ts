import { IndexedTriple } from '../types';
import { SeededRandom } from '../utils/Random';

export class NegativeSampler {
    constructor(private readonly random: SeededRandom) { }

    sample(positive: IndexedTriple, entityCount: number): IndexedTriple {
        const corruptHead = this.random.next() < 0.5;
        if (corruptHead) {
            return {
                head: this.random.int(entityCount),
                relation: positive.relation,
                tail: positive.tail,
            };
        }

        return {
            head: positive.head,
            relation: positive.relation,
            tail: this.random.int(entityCount),
        };
    }
}
