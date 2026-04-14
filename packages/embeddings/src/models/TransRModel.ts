import { IndexedTriple } from '../types';
import { SeededRandom } from '../utils/Random';
import { BaseModel } from './BaseModel';

export class TransRModel extends BaseModel {
    private relationProjections: number[][][] = [];

    constructor(dimensions: number, random: SeededRandom, margin: number) {
        super('TransR', dimensions, random, margin);
    }

    override initialize(entityCount: number, relationCount: number): void {
        super.initialize(entityCount, relationCount);
        this.relationProjections = [];
        for (let r = 0; r < relationCount; r += 1) {
            const matrix: number[][] = [];
            for (let i = 0; i < this.dimensions; i += 1) {
                const row: number[] = [];
                for (let j = 0; j < this.dimensions; j += 1) {
                    row.push(i === j ? 1 : (this.random.next() - 0.5) * 0.02);
                }
                matrix.push(row);
            }
            this.relationProjections.push(matrix);
        }
    }

    score(triple: IndexedTriple): number {
        const m = this.relationProjections[triple.relation];
        const h = this.project(m, this.entityEmbeddings[triple.head]);
        const t = this.project(m, this.entityEmbeddings[triple.tail]);
        const r = this.relationEmbeddings[triple.relation];

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

    getRelationProjections(): number[][][] {
        return this.relationProjections;
    }

    private project(matrix: number[][], vector: number[]): number[] {
        const out = new Array<number>(this.dimensions).fill(0);
        for (let i = 0; i < this.dimensions; i += 1) {
            for (let j = 0; j < this.dimensions; j += 1) {
                out[i] += matrix[i][j] * vector[j];
            }
        }
        return out;
    }

    private updateTriple(triple: IndexedTriple, learningRate: number, direction: 1 | -1): void {
        const h = this.entityEmbeddings[triple.head];
        const t = this.entityEmbeddings[triple.tail];
        const r = this.relationEmbeddings[triple.relation];
        const m = this.relationProjections[triple.relation];

        const hProj = this.project(m, h);
        const tProj = this.project(m, t);

        for (let i = 0; i < this.dimensions; i += 1) {
            const grad = Math.sign(hProj[i] + r[i] - tProj[i]) * direction;
            r[i] -= learningRate * grad;

            for (let j = 0; j < this.dimensions; j += 1) {
                const hGrad = grad * m[i][j];
                const tGrad = grad * m[i][j];
                h[j] -= learningRate * hGrad;
                t[j] += learningRate * tGrad;
                m[i][j] -= learningRate * grad * (h[j] - t[j]) * 0.02;
            }
        }
    }
}
