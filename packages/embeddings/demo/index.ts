import { RDFStore } from '@kg/core';
import { KGEEngine } from '../src';

const DATA = `
@prefix : <http://example.org/> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix ex: <http://example.org/rel/> .

:Alice foaf:knows :Bob .
:Bob foaf:knows :Charlie .
:Charlie foaf:knows :Dina .
:Dina foaf:knows :Alice .
:Alice ex:likes :Graphs .
:Bob ex:likes :SPARQL .
:Charlie ex:likes :Reasoning .
:Dina ex:likes :Embeddings .
`;

async function run(): Promise<void> {
    const store = new RDFStore();
    await store.load(DATA, 'turtle');

    const engine = new KGEEngine();

    const comparison = await engine.compare(
        store,
        {
            algorithm: 'TransE',
            dimensions: 24,
            epochs: 25,
            learningRate: 0.02,
            seed: 7,
        },
        {
            algorithm: 'ComplEx',
            dimensions: 24,
            epochs: 25,
            learningRate: 0.02,
            seed: 7,
        }
    );

    console.log('=== Embedding Comparison Demo ===');
    console.log('Run A:', comparison.runA.algorithm, comparison.runA.metrics);
    console.log('Run B:', comparison.runB.algorithm, comparison.runB.metrics);
    console.log('Recommended algorithm:', comparison.recommended);
    console.log('Projected points A:', comparison.runA.points2D.length);
    console.log('Projected points B:', comparison.runB.points2D.length);
}

run().catch((error) => {
    console.error('Embedding demo failed:', error);
    process.exit(1);
});
