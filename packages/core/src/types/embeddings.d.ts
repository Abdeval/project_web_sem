/**
 * Embedding Types - Knowledge graph embedding contracts
 */
import { Triple } from './rdf';
/**
 * Supported KGE algorithms for the MVP.
 */
export type EmbeddingAlgorithm = 'TransE' | 'TransH' | 'TransR' | 'DistMult' | 'ComplEx';
/**
 * Optional aliases accepted by UI/user inputs.
 */
export type EmbeddingAlgorithmAlias = 'dismult';
/**
 * Generic training configuration for KGE models.
 */
export interface EmbeddingTrainingConfig {
    algorithm: EmbeddingAlgorithm;
    dimensions: number;
    epochs: number;
    learningRate: number;
    margin?: number;
    negativeSamples?: number;
    seed?: number;
    includeLiterals?: boolean;
}
/**
 * Entity/relation index dictionaries produced during training.
 */
export interface EmbeddingIndex {
    entities: string[];
    relations: string[];
    entityToIndex: Record<string, number>;
    relationToIndex: Record<string, number>;
}
/**
 * Learned embeddings.
 */
export interface EmbeddingModel {
    algorithm: EmbeddingAlgorithm;
    dimensions: number;
    entityEmbeddings: Record<string, number[]>;
    relationEmbeddings: Record<string, number[]>;
    relationProjections?: Record<string, number[][]>;
    relationNormals?: Record<string, number[]>;
    trainedEpochs: number;
}
/**
 * Training result returned by KGE engines.
 */
export interface EmbeddingTrainingResult {
    model: EmbeddingModel;
    executionTime: number;
    finalLoss: number;
    lossHistory: number[];
    tripleCount: number;
    entityCount: number;
    relationCount: number;
}
/**
 * A scored link prediction candidate.
 */
export interface LinkPrediction {
    triple: Triple;
    score: number;
}
/**
 * Common metrics used for algorithm comparison.
 */
export interface EmbeddingComparisonMetrics {
    executionTime: number;
    finalLoss: number;
    averagePositiveScore: number;
    averageNegativeScore: number;
    scoreGap: number;
    tripleCount: number;
    entityCount: number;
    relationCount: number;
}
/**
 * 2D projected point for visualization in the desktop app.
 */
export interface EmbeddingPoint2D {
    id: string;
    x: number;
    y: number;
    kind: 'entity' | 'relation';
}
/**
 * Output of a single algorithm run in a comparison.
 */
export interface EmbeddingComparisonRun {
    algorithm: EmbeddingAlgorithm;
    config: EmbeddingTrainingConfig;
    metrics: EmbeddingComparisonMetrics;
    points2D: EmbeddingPoint2D[];
}
/**
 * A/B comparison payload.
 */
export interface EmbeddingComparisonResult {
    runA: EmbeddingComparisonRun;
    runB: EmbeddingComparisonRun;
    recommended: EmbeddingAlgorithm;
}
//# sourceMappingURL=embeddings.d.ts.map