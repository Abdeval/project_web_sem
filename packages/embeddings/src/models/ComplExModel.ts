import { IndexedTriple } from '../types';
import { SeededRandom } from '../utils/Random';
import { BaseModel } from './BaseModel';

export class ComplExModel extends BaseModel {
    private readonly halfDim: number;

    constructor(dimensions: number, random: SeededRandom, margin: number) {
        super('ComplEx', dimensions % 2 === 0 ? dimensions : dimensions + 1, random, margin);
        this.halfDim = this.dimensions / 2;
    }

    score(triple: IndexedTriple): number {
        const h = this.entityEmbeddings[triple.head];
        const r = this.relationEmbeddings[triple.relation];
        const t = this.entityEmbeddings[triple.tail];

        let raw = 0;
        for (let i = 0; i < this.halfDim; i += 1) {
            const hRe = h[i];
            const hIm = h[i + this.halfDim];
            const rRe = r[i];
            const rIm = r[i + this.halfDim];
            const tRe = t[i];
            const tIm = t[i + this.halfDim];

            raw += hRe * rRe * tRe;
            raw += hIm * rRe * tIm;
            raw += hRe * rIm * tIm;
            raw -= hIm * rIm * tRe;
        }

        return -raw;
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

        for (let i = 0; i < this.halfDim; i += 1) {
            const hi = i + this.halfDim;

            const hRe = h[i];
            const hIm = h[hi];
            const rRe = r[i];
            const rIm = r[hi];
            const tRe = t[i];
            const tIm = t[hi];

            const dHRe = -(rRe * tRe + rIm * tIm) * direction;
            const dHIm = -(rRe * tIm - rIm * tRe) * direction;
            const dRRe = -(hRe * tRe + hIm * tIm) * direction;
            const dRIm = -(hRe * tIm - hIm * tRe) * direction;
            const dTRe = -(hRe * rRe - hIm * rIm) * direction;
            const dTIm = -(hIm * rRe + hRe * rIm) * direction;

            h[i] -= learningRate * dHRe;
            h[hi] -= learningRate * dHIm;
            r[i] -= learningRate * dRRe;
            r[hi] -= learningRate * dRIm;
            t[i] -= learningRate * dTRe;
            t[hi] -= learningRate * dTIm;
        }
    }
}
