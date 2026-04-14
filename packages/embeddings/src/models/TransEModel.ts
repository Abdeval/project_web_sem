import { IndexedTriple } from '../types';
import { SeededRandom } from '../utils/Random';
import { BaseModel } from './BaseModel';

export class TransEModel extends BaseModel {
    constructor(dimensions: number, random: SeededRandom, margin: number) {
        super('TransE', dimensions, random, margin);
    }

    score(triple: IndexedTriple): number {
        const h = this.entityEmbeddings[triple.head];
        const r = this.relationEmbeddings[triple.relation];
        const t = this.entityEmbeddings[triple.tail];

        let distance = 0;
        for (let i = 0; i < this.dimensions; i += 1) {
            distance += Math.abs(h[i] + r[i] - t[i]);
        }
        return distance;
    }

    trainStep(positive: IndexedTriple, negative: IndexedTriple, learningRate: number): number {
        const posScore = this.score(positive);
        const negScore = this.score(negative);
        const loss = this.hingeLoss(posScore, negScore);

        if (loss <= 0) {
            return 0;
        }

        this.updateTriple(positive, learningRate, 1);
        this.updateTriple(negative, learningRate, -1);

        this.normalize(this.entityEmbeddings[positive.head]);
        this.normalize(this.entityEmbeddings[positive.tail]);
        this.normalize(this.entityEmbeddings[negative.head]);
        this.normalize(this.entityEmbeddings[negative.tail]);
        this.normalize(this.relationEmbeddings[positive.relation]);

        return loss;
    }

    private updateTriple(triple: IndexedTriple, learningRate: number, direction: 1 | -1): void {
        const h = this.entityEmbeddings[triple.head];
        const r = this.relationEmbeddings[triple.relation];
        const t = this.entityEmbeddings[triple.tail];

        for (let i = 0; i < this.dimensions; i += 1) {
            const grad = Math.sign(h[i] + r[i] - t[i]) * direction;
            h[i] -= learningRate * grad;
            r[i] -= learningRate * grad;
            t[i] += learningRate * grad;
        }
    }
}
