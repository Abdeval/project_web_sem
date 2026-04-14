import { IndexedTriple, KGEModel } from '../types';
import { SeededRandom } from '../utils/Random';

export abstract class BaseModel implements KGEModel {
    protected entityEmbeddings: number[][] = [];
    protected relationEmbeddings: number[][] = [];

    constructor(
        public readonly algorithm: KGEModel['algorithm'],
        public readonly dimensions: number,
        protected readonly random: SeededRandom,
        protected readonly margin: number
    ) { }

    initialize(entityCount: number, relationCount: number): void {
        this.entityEmbeddings = this.initMatrix(entityCount, this.dimensions);
        this.relationEmbeddings = this.initMatrix(relationCount, this.dimensions);
    }

    getEntityEmbeddings(): number[][] {
        return this.entityEmbeddings;
    }

    getRelationEmbeddings(): number[][] {
        return this.relationEmbeddings;
    }

    abstract trainStep(positive: IndexedTriple, negative: IndexedTriple, learningRate: number): number;
    abstract score(triple: IndexedTriple): number;

    protected initMatrix(rows: number, cols: number): number[][] {
        const matrix: number[][] = [];
        for (let i = 0; i < rows; i += 1) {
            const row: number[] = [];
            for (let j = 0; j < cols; j += 1) {
                row.push((this.random.next() - 0.5) * 0.2);
            }
            this.normalize(row);
            matrix.push(row);
        }
        return matrix;
    }

    protected l2Norm(vec: number[]): number {
        let sum = 0;
        for (let i = 0; i < vec.length; i += 1) {
            sum += vec[i] * vec[i];
        }
        return Math.sqrt(sum) + 1e-12;
    }

    protected normalize(vec: number[]): void {
        const norm = this.l2Norm(vec);
        for (let i = 0; i < vec.length; i += 1) {
            vec[i] /= norm;
        }
    }

    protected hingeLoss(posScore: number, negScore: number): number {
        return Math.max(0, this.margin + posScore - negScore);
    }
}
