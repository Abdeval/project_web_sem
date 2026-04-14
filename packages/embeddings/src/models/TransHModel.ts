import { IndexedTriple } from '../types';
import { SeededRandom } from '../utils/Random';
import { BaseModel } from './BaseModel';

export class TransHModel extends BaseModel {
    private relationNormals: number[][] = [];

    constructor(dimensions: number, random: SeededRandom, margin: number) {
        super('TransH', dimensions, random, margin);
    }

    override initialize(entityCount: number, relationCount: number): void {
        super.initialize(entityCount, relationCount);
        this.relationNormals = this.initMatrix(relationCount, this.dimensions);
    }

    score(triple: IndexedTriple): number {
        const w = this.relationNormals[triple.relation];
        const h = this.project(this.entityEmbeddings[triple.head], w);
        const t = this.project(this.entityEmbeddings[triple.tail], w);
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
        this.normalize(this.relationNormals[positive.relation]);

        return loss;
    }

    getRelationNormals(): number[][] {
        return this.relationNormals;
    }

    private dot(a: number[], b: number[]): number {
        let out = 0;
        for (let i = 0; i < a.length; i += 1) {
            out += a[i] * b[i];
        }
        return out;
    }

    private project(vector: number[], normal: number[]): number[] {
        const factor = this.dot(vector, normal);
        const projected = new Array<number>(vector.length);
        for (let i = 0; i < vector.length; i += 1) {
            projected[i] = vector[i] - factor * normal[i];
        }
        return projected;
    }

    private updateTriple(triple: IndexedTriple, learningRate: number, direction: 1 | -1): void {
        const h = this.entityEmbeddings[triple.head];
        const t = this.entityEmbeddings[triple.tail];
        const r = this.relationEmbeddings[triple.relation];
        const w = this.relationNormals[triple.relation];

        const hProj = this.project(h, w);
        const tProj = this.project(t, w);

        for (let i = 0; i < this.dimensions; i += 1) {
            const grad = Math.sign(hProj[i] + r[i] - tProj[i]) * direction;
            h[i] -= learningRate * grad;
            r[i] -= learningRate * grad;
            t[i] += learningRate * grad;
            w[i] -= learningRate * grad * 0.05;
        }
    }
}
