import {
    EmbeddingAlgorithm,
    EmbeddingComparisonMetrics,
    EmbeddingComparisonResult,
    EmbeddingTrainingConfig,
    EmbeddingTrainingResult,
    IEmbeddingEngine,
    IRDFStore,
} from '@kg/core';
import { NegativeSampler } from './data/NegativeSampler';
import { TripleIndexer } from './data/TripleIndexer';
import { Projection2D } from './eval/Projection2D';
import { createModel } from './models/createModel';
import { IndexedDataset, KGEModel } from './types';
import { Trainer } from './training/Trainer';
import { SeededRandom } from './utils/Random';

const DEFAULTS: Omit<EmbeddingTrainingConfig, 'algorithm'> = {
    dimensions: 32,
    epochs: 40,
    learningRate: 0.01,
    margin: 1,
    negativeSamples: 1,
    seed: 42,
    includeLiterals: false,
};

interface InternalRun {
    model: KGEModel;
    result: EmbeddingTrainingResult;
    dataset: IndexedDataset;
}

export class KGEEngine implements IEmbeddingEngine {
    private defaults: Partial<EmbeddingTrainingConfig> = { ...DEFAULTS };

    configure(config: Partial<EmbeddingTrainingConfig>): void {
        this.defaults = {
            ...this.defaults,
            ...config,
        };
    }

    getConfig(): Partial<EmbeddingTrainingConfig> {
        return { ...this.defaults };
    }

    getSupportedAlgorithms(): EmbeddingAlgorithm[] {
        return ['TransE', 'TransH', 'TransR', 'DistMult', 'ComplEx'];
    }

    async train(store: IRDFStore, config: EmbeddingTrainingConfig): Promise<EmbeddingTrainingResult> {
        const run = this.trainInternal(store, this.mergeConfig(config));
        return run.result;
    }

    async compare(
        store: IRDFStore,
        configA: EmbeddingTrainingConfig,
        configB: EmbeddingTrainingConfig
    ): Promise<EmbeddingComparisonResult> {
        const resolvedA = this.mergeConfig(configA);
        const resolvedB = this.mergeConfig(configB);

        const runA = this.trainInternal(store, resolvedA);
        const runB = this.trainInternal(store, resolvedB);

        const metricsA = this.computeMetrics(runA.model, runA.dataset, runA.result);
        const metricsB = this.computeMetrics(runB.model, runB.dataset, runB.result);

        const projection = new Projection2D();

        return {
            runA: {
                algorithm: resolvedA.algorithm,
                config: resolvedA,
                metrics: metricsA,
                points2D: projection.project({
                    entities: runA.dataset.entities,
                    relations: runA.dataset.relations,
                    entityEmbeddings: runA.result.model.entityEmbeddings,
                    relationEmbeddings: runA.result.model.relationEmbeddings,
                }),
            },
            runB: {
                algorithm: resolvedB.algorithm,
                config: resolvedB,
                metrics: metricsB,
                points2D: projection.project({
                    entities: runB.dataset.entities,
                    relations: runB.dataset.relations,
                    entityEmbeddings: runB.result.model.entityEmbeddings,
                    relationEmbeddings: runB.result.model.relationEmbeddings,
                }),
            },
            recommended: metricsA.scoreGap >= metricsB.scoreGap ? resolvedA.algorithm : resolvedB.algorithm,
        };
    }

    private trainInternal(store: IRDFStore, config: EmbeddingTrainingConfig): InternalRun {
        this.validateConfig(config);

        const indexer = new TripleIndexer();
        const { dataset } = indexer.build(store, config.includeLiterals ?? false);

        if (dataset.triples.length === 0) {
            throw new Error('No trainable triples found. Enable includeLiterals or load a denser graph.');
        }

        const random = new SeededRandom(config.seed ?? DEFAULTS.seed);
        const model = createModel(config, random);
        const trainer = new Trainer(random);
        const result = trainer.train(model, dataset, config);

        return { model, result, dataset };
    }

    private computeMetrics(
        model: KGEModel,
        dataset: IndexedDataset,
        result: EmbeddingTrainingResult
    ): EmbeddingComparisonMetrics {
        const random = new SeededRandom(1337);
        const sampler = new NegativeSampler(random);
        const sampleSize = Math.min(dataset.triples.length, 200);

        let positiveSum = 0;
        let negativeSum = 0;

        for (let i = 0; i < sampleSize; i += 1) {
            const triple = dataset.triples[i];
            positiveSum += model.score(triple);
            const negative = sampler.sample(triple, dataset.entities.length);
            negativeSum += model.score(negative);
        }

        const averagePositiveScore = sampleSize > 0 ? positiveSum / sampleSize : 0;
        const averageNegativeScore = sampleSize > 0 ? negativeSum / sampleSize : 0;

        return {
            executionTime: result.executionTime,
            finalLoss: result.finalLoss,
            averagePositiveScore,
            averageNegativeScore,
            scoreGap: averageNegativeScore - averagePositiveScore,
            tripleCount: result.tripleCount,
            entityCount: result.entityCount,
            relationCount: result.relationCount,
        };
    }

    private mergeConfig(config: EmbeddingTrainingConfig): EmbeddingTrainingConfig {
        return {
            algorithm: this.normalizeAlgorithm(config.algorithm),
            dimensions: config.dimensions ?? this.defaults.dimensions ?? DEFAULTS.dimensions,
            epochs: config.epochs ?? this.defaults.epochs ?? DEFAULTS.epochs,
            learningRate: config.learningRate ?? this.defaults.learningRate ?? DEFAULTS.learningRate,
            margin: config.margin ?? this.defaults.margin ?? DEFAULTS.margin,
            negativeSamples: config.negativeSamples ?? this.defaults.negativeSamples ?? DEFAULTS.negativeSamples,
            seed: config.seed ?? this.defaults.seed ?? DEFAULTS.seed,
            includeLiterals: config.includeLiterals ?? this.defaults.includeLiterals ?? DEFAULTS.includeLiterals,
        };
    }

    private normalizeAlgorithm(algorithm: EmbeddingTrainingConfig['algorithm']): EmbeddingAlgorithm {
        if ((algorithm as unknown as string).toLowerCase() === 'dismult') {
            return 'DistMult';
        }
        return algorithm;
    }

    private validateConfig(config: EmbeddingTrainingConfig): void {
        if (config.dimensions <= 0) {
            throw new Error('dimensions must be greater than 0');
        }
        if (config.epochs <= 0) {
            throw new Error('epochs must be greater than 0');
        }
        if (config.learningRate <= 0) {
            throw new Error('learningRate must be greater than 0');
        }
    }
}
