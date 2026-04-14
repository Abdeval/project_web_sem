import { EmbeddingTrainingConfig, Triple } from '@kg/core';

export interface IndexedTriple {
    head: number;
    relation: number;
    tail: number;
}

export interface IndexedDataset {
    triples: IndexedTriple[];
    entities: string[];
    relations: string[];
}

export interface TrainingContext {
    config: EmbeddingTrainingConfig;
    dataset: IndexedDataset;
}

export interface KGEModel {
    readonly algorithm: EmbeddingTrainingConfig['algorithm'];
    readonly dimensions: number;
    initialize(entityCount: number, relationCount: number): void;
    trainStep(positive: IndexedTriple, negative: IndexedTriple, learningRate: number): number;
    score(triple: IndexedTriple): number;
    getEntityEmbeddings(): number[][];
    getRelationEmbeddings(): number[][];
    getRelationNormals?(): number[][];
    getRelationProjections?(): number[][][];
}

export interface DatasetMapping {
    entities: string[];
    relations: string[];
    entityToIndex: Record<string, number>;
    relationToIndex: Record<string, number>;
}

export interface ProjectionInput {
    entities: string[];
    relations: string[];
    entityEmbeddings: Record<string, number[]>;
    relationEmbeddings: Record<string, number[]>;
}

export function cloneTriple(triple: Triple): Triple {
    return {
        subject: { ...triple.subject },
        predicate: { ...triple.predicate },
        object: { ...triple.object },
    };
}
