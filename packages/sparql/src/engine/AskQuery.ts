/**
 * ASK Query Executor
 */

import { IRDFStore, QueryResult } from '@kg/core';
import { evaluatePatterns } from './queryUtils';

export class AskQuery {
    async execute(parsed: any, store: IRDFStore): Promise<QueryResult> {
        const storeTriples = store.getTriples();

        // Evaluate WHERE clause
        const bindings = evaluatePatterns(parsed.where ?? [], storeTriples, {});

        return {
            type: 'ASK',
            boolean: bindings.length > 0,
        };
    }
}
