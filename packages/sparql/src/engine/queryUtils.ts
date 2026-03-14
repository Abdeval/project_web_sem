/**
 * Query evaluation utilities shared across SELECT, CONSTRUCT, ASK
 *
 * Implements basic SPARQL pattern matching:
 * - Triple patterns (variable / URI / literal matching)
 * - FILTER expressions
 * - OPTIONAL (left-join)
 * - UNION
 * - GROUP (nested patterns)
 */

import { Triple } from '@kg/core';

export type BindingMap = Record<string, any>; // variable name → rdf term-like { type, value }

// ────────────────────────────────────────────────────────────
// Core pattern evaluator
// ────────────────────────────────────────────────────────────

/**
 * Evaluate an array of SPARQL WHERE patterns against an array of triples.
 * Returns all possible binding maps that satisfy the patterns.
 */
export function evaluatePatterns(
    patterns: any[],
    triples: Triple[],
    initialBinding: BindingMap
): BindingMap[] {
    let results: BindingMap[] = [initialBinding];

    for (const pattern of patterns) {
        results = evaluateSingle(pattern, triples, results);
    }

    return results;
}

function evaluateSingle(pattern: any, triples: Triple[], bindings: BindingMap[]): BindingMap[] {
    switch (pattern.type) {
        case 'bgp':
            return evaluateBGP(pattern.triples, triples, bindings);
        case 'filter':
            return bindings.filter((b) => evaluateFilter(pattern.expression, b));
        case 'optional':
            return evaluateOptional(pattern.patterns, triples, bindings);
        case 'union':
            return evaluateUnion(pattern.patterns, triples, bindings);
        case 'group': {
            // Evaluate for ALL bindings, not just the first one (was a bug).
            const groupResults: BindingMap[] = [];
            for (const binding of bindings) {
                groupResults.push(...evaluatePatterns(pattern.patterns, triples, binding));
            }
            return groupResults.length > 0 ? groupResults : bindings;
        }
        default:
            // Unknown pattern type — pass through
            return bindings;
    }
}

// ────────────────────────────────────────────────────────────
// BGP (Basic Graph Pattern) evaluation
// ────────────────────────────────────────────────────────────

function evaluateBGP(
    sparqlTriples: any[],
    storeTriples: Triple[],
    bindings: BindingMap[]
): BindingMap[] {
    let current = bindings;

    for (const pattern of sparqlTriples) {
        const next: BindingMap[] = [];
        for (const binding of current) {
            const matches = matchTriplePattern(pattern, storeTriples, binding);
            next.push(...matches);
        }
        current = next;
    }

    return current;
}

/**
 * Try to match a single triple pattern against all store triples,
 * returning extended bindings for each match.
 */
function matchTriplePattern(
    pattern: any,
    storeTriples: Triple[],
    binding: BindingMap
): BindingMap[] {
    const results: BindingMap[] = [];

    for (const triple of storeTriples) {
        const newBinding = tryMatch(pattern, triple, { ...binding });
        if (newBinding !== null) {
            results.push(newBinding);
        }
    }

    return results;
}

/**
 * Try to match a triple pattern against a store triple.
 * Returns extended binding or null on failure.
 */
function tryMatch(
    pattern: any,
    triple: Triple,
    binding: BindingMap
): BindingMap | null {
    const s = binding;

    // Match subject
    const bAfterSubject = matchTerm(pattern.subject, triple.subject, { ...s });
    if (bAfterSubject === null) return null;

    // Match predicate
    const bAfterPredicate = matchTerm(pattern.predicate, triple.predicate, bAfterSubject);
    if (bAfterPredicate === null) return null;

    // Match object
    const bAfterObject = matchTerm(pattern.object, triple.object, bAfterPredicate);
    return bAfterObject;
}

/**
 * Match a single SPARQL term (variable, URI, literal) against an RDF term.
 */
function matchTerm(
    sparqlTerm: any,
    rdflibTerm: any,
    binding: BindingMap
): BindingMap | null {
    if (sparqlTerm.termType === 'Variable') {
        const varName = sparqlTerm.value;
        if (binding[varName] !== undefined) {
            // Variable already bound — must be equal
            return termToString(binding[varName]) === termToString(rdflibTerm) ? binding : null;
        }
        // Bind the variable
        binding[varName] = rdflibTerm;
        return binding;
    }

    if (sparqlTerm.termType === 'NamedNode') {
        if (rdflibTerm.type === 'NamedNode' && rdflibTerm.value === sparqlTerm.value) {
            return binding;
        }
        return null;
    }

    if (sparqlTerm.termType === 'Literal') {
        if (
            rdflibTerm.type === 'Literal' &&
            rdflibTerm.value === sparqlTerm.value
        ) {
            return binding;
        }
        return null;
    }

    // Wildcard / blanknodes — treat as match
    return binding;
}

// ────────────────────────────────────────────────────────────
// OPTIONAL (left join)
// ────────────────────────────────────────────────────────────

function evaluateOptional(
    patterns: any[],
    triples: Triple[],
    bindings: BindingMap[]
): BindingMap[] {
    const results: BindingMap[] = [];

    for (const binding of bindings) {
        const optResults = evaluatePatterns(patterns, triples, binding);
        if (optResults.length > 0) {
            results.push(...optResults);
        } else {
            // Keep the original binding (left-join semantics)
            results.push({ ...binding });
        }
    }

    return results;
}

// ────────────────────────────────────────────────────────────
// UNION
// ────────────────────────────────────────────────────────────

function evaluateUnion(
    branches: any[],
    triples: Triple[],
    bindings: BindingMap[]
): BindingMap[] {
    const results: BindingMap[] = [];

    for (const branch of branches) {
        const branchPatterns = branch.patterns ?? branch;
        for (const binding of bindings) {
            const branchResults = evaluatePatterns(branchPatterns, triples, binding);
            results.push(...branchResults);
        }
    }

    return results;
}

// ────────────────────────────────────────────────────────────
// FILTER evaluation
// ────────────────────────────────────────────────────────────

export function evaluateFilter(expression: any, binding: BindingMap): boolean {
    try {
        return !!evalExpr(expression, binding);
    } catch {
        return false;
    }
}

function evalExpr(expr: any, binding: BindingMap): any {
    if (!expr) return true;

    switch (expr.type) {
        case 'operation': {
            const args = (expr.args ?? []).map((a: any) => evalExpr(a, binding));
            switch (expr.operator) {
                case '=': return args[0] === args[1] || String(args[0]) === String(args[1]);
                case '!=': return String(args[0]) !== String(args[1]);
                case '<': { const na = parseFloat(String(args[0])), nb = parseFloat(String(args[1])); return (!isNaN(na) && !isNaN(nb)) ? na < nb : String(args[0]) < String(args[1]); }
                case '>': { const na = parseFloat(String(args[0])), nb = parseFloat(String(args[1])); return (!isNaN(na) && !isNaN(nb)) ? na > nb : String(args[0]) > String(args[1]); }
                case '<=': { const na = parseFloat(String(args[0])), nb = parseFloat(String(args[1])); return (!isNaN(na) && !isNaN(nb)) ? na <= nb : String(args[0]) <= String(args[1]); }
                case '>=': { const na = parseFloat(String(args[0])), nb = parseFloat(String(args[1])); return (!isNaN(na) && !isNaN(nb)) ? na >= nb : String(args[0]) >= String(args[1]); }
                case '&&': return Boolean(args[0]) && Boolean(args[1]);
                case '||': return Boolean(args[0]) || Boolean(args[1]);
                case '!': return !Boolean(args[0]);
                case 'regex': {
                    const str = String(args[0]);
                    const pattern = String(args[1]);
                    const flags = args[2] ? String(args[2]) : '';
                    return new RegExp(pattern, flags).test(str);
                }
                case 'bound':
                    return args[0] !== undefined && args[0] !== '';
                case 'str': return String(args[0]);
                case 'lang': return (typeof args[0] === 'object' && args[0]?.language) ? args[0].language : '';
                case 'langmatches':
                    return String(args[0]).toLowerCase().startsWith(String(args[1]).toLowerCase());
                case 'datatype': return (typeof args[0] === 'object' && args[0]?.datatype) ? args[0].datatype : '';
                case 'isiri':
                case 'isuri': return args[0]?.type === 'NamedNode';
                case 'isliteral': return args[0]?.type === 'Literal';
                case 'isblank': return args[0]?.type === 'BlankNode';
                default: return true;
            }
        }
        case 'path':
            return true;
        default:
            if (expr.termType === 'Variable') {
                return resolveValue(binding[expr.value]);
            }
            if (expr.termType === 'Literal') {
                return expr.value;
            }
            if (expr.termType === 'NamedNode') {
                return expr.value;
            }
            return String(expr);
    }
}

function resolveValue(term: any): any {
    if (term === undefined) return undefined;
    if (typeof term === 'string') return term;
    if (term && typeof term === 'object') {
        // Core Triple/Term-like object: { type, value }
        return term.value ?? String(term);
    }
    return term;
}

// ────────────────────────────────────────────────────────────
// Term → string conversion
// ────────────────────────────────────────────────────────────

export function termToString(term: any): string {
    if (term === null || term === undefined) return '';
    if (typeof term === 'string') return term;
    if (typeof term === 'number' || typeof term === 'boolean') return String(term);
    if (typeof term === 'object') {
        // Core Term object: { type: 'NamedNode'|'Literal'|'BlankNode', value: string }
        return term.value ?? JSON.stringify(term);
    }
    return String(term);
}

/**
 * Apply instantiated template triples using current binding.
 * Used by CONSTRUCT query.
 */
export function instantiateTemplate(templateTriples: any[], binding: BindingMap): any[] {
    const result: any[] = [];

    for (const t of templateTriples) {
        const subject = instantiateTerm(t.subject, binding);
        const predicate = instantiateTerm(t.predicate, binding);
        const object = instantiateTerm(t.object, binding);

        if (subject && predicate && object) {
            result.push({ subject, predicate, object });
        }
    }

    return result;
}

function instantiateTerm(term: any, binding: BindingMap): any | null {
    if (!term) return null;
    if (term.termType === 'Variable') {
        const val = binding[term.value];
        return val ?? null; // unbound variable → skip triple
    }
    // Already a concrete term
    if (term.termType === 'NamedNode') {
        return { type: 'NamedNode', value: term.value };
    }
    if (term.termType === 'Literal') {
        return {
            type: 'Literal',
            value: term.value,
            language: term.language,
            datatype: term.datatype?.value,
        };
    }
    if (term.termType === 'BlankNode') {
        return { type: 'BlankNode', value: term.value };
    }
    return null;
}
