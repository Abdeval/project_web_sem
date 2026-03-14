/**
 * SELECT Query Executor
 * Evaluates SELECT SPARQL queries against an IRDFStore
 */

import { IRDFStore, QueryResult, Binding } from '@kg/core';
import { evaluatePatterns, termToString, BindingMap } from './queryUtils';

export class SelectQuery {
    async execute(parsed: any, store: IRDFStore): Promise<QueryResult> {
        const triples = store.getTriples();

        // Collect variable names — handle plain variables AND aliased expressions
        // e.g. (COUNT(*) AS ?count) → {expression:{...}, variable:{value:'count'}}
        const variables: string[] = parsed.variables.map((v: any) => {
            if (v === '*') return '*';
            if (v.variable) return v.variable.value;          // aliased expression
            if (v.value && typeof v.value === 'string') return v.value;
            return String(v).replace(/^\?/, '');
        });

        // Evaluate WHERE clause patterns
        let bindings = evaluatePatterns(parsed.where, triples, {});

        // Apply GROUP BY + aggregates before ordering/slicing
        if (parsed.group && parsed.group.length > 0) {
            bindings = applyGroupBy(bindings, parsed.group, parsed.variables);
        }

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
// GROUP BY + Aggregates
// ────────────────────────────────────────────────────────────

function applyGroupBy(
    bindings: BindingMap[],
    group: any[],
    projections: any[]
): BindingMap[] {
    // Extract GROUP BY key variable names
    const groupKeys: string[] = group.map((g: any) => {
        const expr = g.expression ?? g;
        if (expr.termType === 'Variable') return expr.value;
        if (typeof expr.value === 'string') return expr.value;
        return String(expr);
    });

    // Bucket bindings by group key
    const buckets = new Map<string, BindingMap[]>();
    for (const b of bindings) {
        const key = groupKeys.map(k => termToString(b[k] ?? '')).join('\x00');
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key)!.push(b);
    }

    // Collect aggregate projections: entries with .expression.type === 'aggregate'
    const aggProjections = projections.filter(
        (v: any) => v && v.expression && v.expression.type === 'aggregate'
    );

    const result: BindingMap[] = [];
    for (const [, groupBindings] of buckets) {
        const row: BindingMap = {};
        // Populate group-by values from the first binding in the group
        for (const k of groupKeys) {
            row[k] = groupBindings[0][k];
        }
        // Evaluate each aggregate
        for (const proj of aggProjections) {
            const alias: string = proj.variable.value;
            row[alias] = evaluateAggregate(proj.expression, groupBindings);
        }
        result.push(row);
    }
    return result;
}

function evaluateAggregate(expr: any, groupBindings: BindingMap[]): any {
    const lit = (v: string | number) => ({ type: 'Literal', value: String(v) });
    const varName: string | undefined = expr.expression?.termType === 'Variable'
        ? expr.expression.value
        : undefined;

    switch (expr.aggregationType) {
        case 'count': {
            const n = expr.expression === '*' || !varName
                ? groupBindings.length
                : groupBindings.filter(b => b[varName] !== undefined && termToString(b[varName]) !== '').length;
            return lit(n);
        }
        case 'sum': {
            if (!varName) return lit(0);
            const s = groupBindings.reduce((acc, b) => {
                const n = parseFloat(termToString(b[varName] ?? ''));
                return acc + (isNaN(n) ? 0 : n);
            }, 0);
            return lit(s);
        }
        case 'avg': {
            if (!varName || groupBindings.length === 0) return lit(0);
            const s = groupBindings.reduce((acc, b) => {
                const n = parseFloat(termToString(b[varName] ?? ''));
                return acc + (isNaN(n) ? 0 : n);
            }, 0);
            return lit(s / groupBindings.length);
        }
        case 'min': {
            if (!varName) return lit('');
            const vals = groupBindings.map(b => termToString(b[varName] ?? '')).filter(Boolean);
            if (!vals.length) return lit('');
            const nums = vals.map(Number);
            return !nums.some(isNaN)
                ? lit(Math.min(...nums))
                : lit([...vals].sort()[0]);
        }
        case 'max': {
            if (!varName) return lit('');
            const vals = groupBindings.map(b => termToString(b[varName] ?? '')).filter(Boolean);
            if (!vals.length) return lit('');
            const nums = vals.map(Number);
            return !nums.some(isNaN)
                ? lit(Math.max(...nums))
                : lit([...vals].sort().at(-1)!);
        }
        case 'sample':
            return varName && groupBindings.length > 0
                ? (groupBindings[0][varName] ?? lit(''))
                : lit('');
        case 'group_concat': {
            if (!varName) return lit('');
            const sep: string = expr.separator ?? ' ';
            return lit(groupBindings.map(b => termToString(b[varName] ?? '')).filter(Boolean).join(sep));
        }
        default:
            return lit(groupBindings.length);
    }
}

// ────────────────────────────────────────────────────────────
// ORDER BY
// ────────────────────────────────────────────────────────────

function applyOrderBy(
    bindings: BindingMap[],
    order: Array<{ expression: any; descending: boolean }>
): BindingMap[] {
    return [...bindings].sort((a, b) => {
        for (const { expression, descending } of order) {
            // Variable reference or expression with a .value name
            const varName =
                expression.termType === 'Variable'
                    ? expression.value
                    : (typeof expression.value === 'string'
                        ? expression.value.replace(/^\?/, '')
                        : undefined);
            if (!varName) continue;
            const aStr = termToString(a[varName] ?? '');
            const bStr = termToString(b[varName] ?? '');
            // Try numeric comparison (important for COUNT/SUM results)
            const aN = parseFloat(aStr), bN = parseFloat(bStr);
            const cmp = (!isNaN(aN) && !isNaN(bN))
                ? (aN < bN ? -1 : aN > bN ? 1 : 0)
                : (aStr < bStr ? -1 : aStr > bStr ? 1 : 0);
            if (cmp !== 0) return descending ? -cmp : cmp;
        }
        return 0;
    });
}

// ────────────────────────────────────────────────────────────
// DISTINCT
// ────────────────────────────────────────────────────────────

function deduplicateBindings(bindings: BindingMap[]): BindingMap[] {
    const seen = new Set<string>();
    return bindings.filter((b) => {
        const key = JSON.stringify(b);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
