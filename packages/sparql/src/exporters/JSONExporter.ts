/**
 * JSONExporter - Exports query results to SPARQL JSON Results Format (W3C)
 * https://www.w3.org/TR/sparql11-results-json/
 */

import { QueryResult } from '@kg/core';

export class JSONExporter {
    export(result: QueryResult): string {
        const output = this.buildJSON(result);
        return JSON.stringify(output, null, 2);
    }

    buildJSON(result: QueryResult): object {
        switch (result.type) {
            case 'SELECT': {
                const vars = result.variables ?? [];
                const bindings = (result.bindings ?? []).map((row) => {
                    const b: Record<string, any> = {};
                    for (const v of vars) {
                        const val = row[v];
                        if (val !== undefined && val !== '') {
                            b[v] = this.toJSONTerm(val);
                        }
                    }
                    return b;
                });
                return {
                    head: { vars },
                    results: { bindings },
                };
            }
            case 'ASK': {
                return {
                    head: {},
                    boolean: result.boolean ?? false,
                };
            }
            case 'CONSTRUCT':
            case 'DESCRIBE': {
                const triples = (result.triples ?? []).map((t) => ({
                    subject: this.toJSONTerm(t.subject),
                    predicate: this.toJSONTerm(t.predicate),
                    object: this.toJSONTerm(t.object),
                }));
                return { triples };
            }
            default:
                return result as any;
        }
    }

    private toJSONTerm(term: any): Record<string, string> {
        if (typeof term === 'string') {
            return { type: 'literal', value: term };
        }
        if (!term) return { type: 'literal', value: '' };

        if (term.type === 'NamedNode') {
            return { type: 'uri', value: term.value };
        }
        if (term.type === 'BlankNode') {
            return { type: 'bnode', value: term.value };
        }
        if (term.type === 'Literal') {
            const result: Record<string, string> = { type: 'literal', value: term.value };
            if (term.language) result['xml:lang'] = term.language;
            if (term.datatype) result.datatype = term.datatype;
            return result;
        }
        return { type: 'literal', value: String(term.value ?? term) };
    }
}
