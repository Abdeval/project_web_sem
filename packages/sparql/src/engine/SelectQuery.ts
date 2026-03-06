/**
 * SELECT Query Executor
 * Evaluates SELECT SPARQL queries against an IRDFStore
 */

import { IRDFStore, QueryResult, Binding } from '@kg/core';
import { evaluatePatterns, termToString } from './queryUtils';

export class SelectQuery {
    async execute(parsed: any, store: IRDFStore): Promise<QueryResult> {
        const triples = store.getTriples();

        // Collect variable names (strip leading '?')
        const variables: string[] = parsed.variables.map((v: any) =>
            v === '*' ? '*' : v.value ? v.value : String(v).replace(/^\?/, '')
        );

        // Evaluate WHERE clause patterns
        let bindings = evaluatePatterns(parsed.where, triples, {});

        // Apply DISTINCT
        if (parsed.distinct) {
            bindings = deduplicateBindings(bindings);
        }

        // Apply ORDER BY
        if (parsed.order && parsed.order.length > 0) {
            bindings = applyOrderBy(bindings, parsed.order);
        }

        // Apply OFFSET
        if (parsed.offset && parsed.offset > 0) {
            bindings = bindings.slice(parsed.offset);
        }

        // Apply LIMIT
        if (parsed.limit != null && parsed.limit >= 0) {
            bindings = bindings.slice(0, parsed.limit);
        }

        // If SELECT *, collect all variables from bindings
        let finalVars = variables;
        if (variables.includes('*') || variables.length === 0) {
            const varSet = new Set<string>();
            bindings.forEach((b) => Object.keys(b).forEach((k) => varSet.add(k)));
            finalVars = Array.from(varSet);
        }

        // Shape bindings: keep only requested variables, convert to string values
        const shaped: Binding[] = bindings.map((b) => {
            const row: Binding = {};
            for (const v of finalVars) {
                const val = b[v];
                row[v] = val !== undefined ? termToString(val) : '';
            }
            return row;
        });

        return {
            type: 'SELECT',
            variables: finalVars,
            bindings: shaped,
            count: shaped.length,
        };
    }
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function deduplicateBindings(bindings: Record<string, any>[]): Record<string, any>[] {
    const seen = new Set<string>();
    return bindings.filter((b) => {
        const key = JSON.stringify(b);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function applyOrderBy(
    bindings: Record<string, any>[],
    order: Array<{ expression: any; descending: boolean }>
): Record<string, any>[] {
    return [...bindings].sort((a, b) => {
        for (const { expression, descending } of order) {
            const varName =
                expression.termType === 'Variable'
                    ? expression.value
                    : expression.value?.replace(/^\?/, '');
            const aVal = termToString(a[varName] ?? '') ?? '';
            const bVal = termToString(b[varName] ?? '') ?? '';
            const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            if (cmp !== 0) return descending ? -cmp : cmp;
        }
        return 0;
    });
}
