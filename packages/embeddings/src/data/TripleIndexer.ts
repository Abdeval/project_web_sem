import { IRDFStore } from '@kg/core';
import { DatasetMapping, IndexedDataset, IndexedTriple } from '../types';

function objectToEntityId(object: { type: string; value: string }, includeLiterals: boolean): string | null {
    if (object.type === 'Literal') {
        return includeLiterals ? `lit:${object.value}` : null;
    }
    return object.value;
}

export class TripleIndexer {
    build(store: IRDFStore, includeLiterals: boolean = false): { dataset: IndexedDataset; mapping: DatasetMapping } {
        const triples = store.getTriples();

        const entitySet = new Set<string>();
        const relationSet = new Set<string>();
        const indexed: IndexedTriple[] = [];

        for (const triple of triples) {
            const head = triple.subject.value;
            const relation = triple.predicate.value;
            const tail = objectToEntityId(triple.object, includeLiterals);

            if (!tail) {
                continue;
            }

            entitySet.add(head);
            entitySet.add(tail);
            relationSet.add(relation);
        }

        const entities = Array.from(entitySet);
        const relations = Array.from(relationSet);
        const entityToIndex: Record<string, number> = {};
        const relationToIndex: Record<string, number> = {};

        for (let i = 0; i < entities.length; i += 1) {
            entityToIndex[entities[i]] = i;
        }
        for (let i = 0; i < relations.length; i += 1) {
            relationToIndex[relations[i]] = i;
        }

        for (const triple of triples) {
            const head = triple.subject.value;
            const relation = triple.predicate.value;
            const tail = objectToEntityId(triple.object, includeLiterals);

            if (!tail) {
                continue;
            }

            const indexedTriple: IndexedTriple = {
                head: entityToIndex[head],
                relation: relationToIndex[relation],
                tail: entityToIndex[tail],
            };
            indexed.push(indexedTriple);
        }

        return {
            dataset: {
                triples: indexed,
                entities,
                relations,
            },
            mapping: {
                entities,
                relations,
                entityToIndex,
                relationToIndex,
            },
        };
    }
}
