/**
 * CONSTRUCT Query Executor
 */

import { IRDFStore, QueryResult, Triple } from '@kg/core';
import { evaluatePatterns, instantiateTemplate, termToString } from './queryUtils';

export class ConstructQuery {
    async execute(parsed: any, store: IRDFStore): Promise<QueryResult> {
        const storeTriples = store.getTriples();

        // Evaluate WHERE clause to get bindings
        const bindings = evaluatePatterns(parsed.where ?? [], storeTriples, {});

        // Get template (CONSTRUCT { ... })
        const template: any[] = parsed.template ?? [];

        // Instantiate template for each binding
        const constructedRaw: any[] = [];
        for (const binding of bindings) {
            const instantiated = instantiateTemplate(template, binding);
            constructedRaw.push(...instantiated);
        }

        // Deduplicate triples
        const seen = new Set<string>();
        const triples: Triple[] = [];
        for (const t of constructedRaw) {
            const key = `${termToString(t.subject)}|${termToString(t.predicate)}|${termToString(t.object)}`;
            if (!seen.has(key)) {
                seen.add(key);
                triples.push(t as Triple);
            }
        }

        return {
            type: 'CONSTRUCT',
            triples,
            count: triples.length,
        };
    }
}
