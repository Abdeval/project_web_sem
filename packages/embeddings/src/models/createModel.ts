import { EmbeddingTrainingConfig } from '@kg/core';
import { KGEModel } from '../types';
import { SeededRandom } from '../utils/Random';
import { ComplExModel } from './ComplExModel';
import { DistMultModel } from './DistMultModel';
import { TransEModel } from './TransEModel';
import { TransHModel } from './TransHModel';
import { TransRModel } from './TransRModel';

export function createModel(config: EmbeddingTrainingConfig, random: SeededRandom): KGEModel {
    const margin = config.margin ?? 1;

    switch (config.algorithm) {
        case 'TransE':
            return new TransEModel(config.dimensions, random, margin);
        case 'TransH':
            return new TransHModel(config.dimensions, random, margin);
        case 'TransR':
            return new TransRModel(config.dimensions, random, margin);
        case 'DistMult':
            return new DistMultModel(config.dimensions, random, margin);
        case 'ComplEx':
            return new ComplExModel(config.dimensions, random, margin);
        default:
            throw new Error(`Unsupported embedding algorithm: ${String(config.algorithm)}`);
    }
}
