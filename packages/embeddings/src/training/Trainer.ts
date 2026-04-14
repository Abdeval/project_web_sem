import { EmbeddingTrainingConfig, EmbeddingTrainingResult } from '@kg/core';
import { IndexedDataset, KGEModel } from '../types';
import { NegativeSampler } from '../data/NegativeSampler';
import { SeededRandom } from '../utils/Random';

export class Trainer {
    constructor(private readonly random: SeededRandom) { }

    train(model: KGEModel, dataset: IndexedDataset, config: EmbeddingTrainingConfig): EmbeddingTrainingResult {
        const start = Date.now();
        const lossHistory: number[] = [];
        const sampler = new NegativeSampler(this.random);

        model.initialize(dataset.entities.length, dataset.relations.length);

        for (let epoch = 0; epoch < config.epochs; epoch += 1) {
            let epochLoss = 0;

            for (const positive of dataset.triples) {
                const negative = sampler.sample(positive, dataset.entities.length);
                epochLoss += model.trainStep(positive, negative, config.learningRate);
            }

            const avgLoss = dataset.triples.length > 0 ? epochLoss / dataset.triples.length : 0;
            lossHistory.push(avgLoss);
        }

        return {
            model: {
                algorithm: model.algorithm,
                dimensions: model.dimensions,
                entityEmbeddings: this.toEmbeddingMap(dataset.entities, model.getEntityEmbeddings()),
                relationEmbeddings: this.toEmbeddingMap(dataset.relations, model.getRelationEmbeddings()),
                relationProjections: model.getRelationProjections
                    ? this.toProjectionMap(dataset.relations, model.getRelationProjections())
                    : undefined,
                relationNormals: model.getRelationNormals
                    ? this.toEmbeddingMap(dataset.relations, model.getRelationNormals())
                    : undefined,
                trainedEpochs: config.epochs,
            },
            executionTime: Date.now() - start,
            finalLoss: lossHistory.length > 0 ? lossHistory[lossHistory.length - 1] : 0,
            lossHistory,
            tripleCount: dataset.triples.length,
            entityCount: dataset.entities.length,
            relationCount: dataset.relations.length,
        };
    }

    private toEmbeddingMap(keys: string[], vectors: number[][]): Record<string, number[]> {
        const out: Record<string, number[]> = {};
        for (let i = 0; i < keys.length; i += 1) {
            out[keys[i]] = [...vectors[i]];
        }
        return out;
    }

    private toProjectionMap(keys: string[], matrices: number[][][]): Record<string, number[][]> {
        const out: Record<string, number[][]> = {};
        for (let i = 0; i < keys.length; i += 1) {
            out[keys[i]] = matrices[i].map((row) => [...row]);
        }
        return out;
    }
}
