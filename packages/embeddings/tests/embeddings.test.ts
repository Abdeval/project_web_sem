import { RDFStore } from '@kg/core';
import { KGEEngine } from '../src';

const SAMPLE = `
@prefix : <http://example.org/> .
@prefix rel: <http://example.org/rel/> .

:A rel:knows :B .
:B rel:knows :C .
:C rel:knows :D .
:D rel:knows :A .
:A rel:likes :X .
:B rel:likes :Y .
:C rel:likes :Z .
`;

describe('KGEEngine', () => {
    let store: RDFStore;

    beforeEach(async () => {
        store = new RDFStore();
        await store.load(SAMPLE, 'turtle');
    });

    it('should train TransE model and return vectors', async () => {
        const engine = new KGEEngine();
        const result = await engine.train(store, {
            algorithm: 'TransE',
            dimensions: 16,
            epochs: 10,
            learningRate: 0.02,
            seed: 42,
        });

        expect(result.model.algorithm).toBe('TransE');
        expect(result.entityCount).toBeGreaterThan(0);
        expect(result.relationCount).toBeGreaterThan(0);

        const firstEntity = Object.values(result.model.entityEmbeddings)[0];
        expect(firstEntity.length).toBe(16);
    });

    it('should compare two algorithms and output recommendation', async () => {
        const engine = new KGEEngine();
        const comparison = await engine.compare(
            store,
            {
                algorithm: 'DistMult',
                dimensions: 16,
                epochs: 8,
                learningRate: 0.02,
                seed: 1,
            },
            {
                algorithm: 'ComplEx',
                dimensions: 16,
                epochs: 8,
                learningRate: 0.02,
                seed: 1,
            }
        );

        expect(comparison.runA.algorithm).toBe('DistMult');
        expect(comparison.runB.algorithm).toBe('ComplEx');
        expect(['DistMult', 'ComplEx']).toContain(comparison.recommended);
        expect(comparison.runA.points2D.length).toBeGreaterThan(0);
        expect(comparison.runB.points2D.length).toBeGreaterThan(0);
    });

    it('should expose all requested algorithms', () => {
        const engine = new KGEEngine();
        expect(engine.getSupportedAlgorithms()).toEqual([
            'TransE',
            'TransH',
            'TransR',
            'DistMult',
            'ComplEx',
        ]);
    });
});
