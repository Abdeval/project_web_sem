import { GraphMapper } from '../src/graph/GraphMapper';
import type { Triple } from '../src/graph/GraphMapper';

describe('GraphMapper', () => {
    it('should convert triples to Cytoscape elements', () => {
        const triples: Triple[] = [
            {
                subject: 'http://example.org/Alice',
                predicate: 'http://xmlns.com/foaf/0.1/knows',
                object: 'http://example.org/Bob',
            },
        ];
        const elements = GraphMapper.triplesToElements(triples);
        expect(elements.nodes).toHaveLength(2);
        expect(elements.edges).toHaveLength(1);
        expect(elements.nodes[0].data.id).toBe('http://example.org/Alice');
    });

    it('should detect literal nodes', () => {
        const triples: Triple[] = [
            { subject: 'http://example.org/Alice', predicate: 'http://xmlns.com/foaf/0.1/name', object: 'Alice' },
        ];
        const elements = GraphMapper.triplesToElements(triples);
        const literalNode = elements.nodes.find(n => n.data.id === 'Alice');
        expect(literalNode?.data.type).toBe('literal');
        expect(literalNode?.classes).toBe('literal-node');
    });

    it('should detect class nodes via rdf:type', () => {
        const triples: Triple[] = [
            {
                subject: 'http://example.org/Alice',
                predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
                object: 'http://xmlns.com/foaf/0.1/Person',
            },
        ];
        const elements = GraphMapper.triplesToElements(triples);
        const classNode = elements.nodes.find(n => n.data.id === 'http://xmlns.com/foaf/0.1/Person');
        expect(classNode?.data.type).toBe('class');
        expect(classNode?.classes).toBe('class-node');
    });

    it('should mark inferred edges', () => {
        const triples: Triple[] = [
            { subject: 'http://ex.org/A', predicate: 'http://ex.org/rel', object: 'http://ex.org/B', inferred: true },
        ];
        const elements = GraphMapper.triplesToElements(triples);
        expect(elements.edges[0].classes).toBe('inferred-edge');
    });

    it('should deduplicate nodes', () => {
        const triples: Triple[] = [
            { subject: 'http://ex.org/Alice', predicate: 'http://ex.org/knows', object: 'http://ex.org/Bob' },
            { subject: 'http://ex.org/Alice', predicate: 'http://ex.org/name', object: 'Alice' },
        ];
        const elements = GraphMapper.triplesToElements(triples);
        const aliceNodes = elements.nodes.filter(n => n.data.id === 'http://ex.org/Alice');
        expect(aliceNodes).toHaveLength(1);
    });
});