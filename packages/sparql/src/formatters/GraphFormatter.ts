/**
 * GraphFormatter - Formats CONSTRUCT results as a list of triples
 */

import { QueryResult } from '@kg/core';

export class GraphFormatter {
    format(result: QueryResult): string {
        if (result.type !== 'CONSTRUCT' || !result.triples) {
            return '[No CONSTRUCT results to display]';
        }

        const triples = result.triples;
        if (triples.length === 0) {
            return '[Empty graph — 0 triples]';
        }

        const lines: string[] = [`Triples (${triples.length}):`];
        for (const t of triples) {
            const s = this.termToString(t.subject);
            const p = this.termToString(t.predicate);
            // const o = this.termToString(t.object);
            lines.push(`  <${s}> <${p}> ${this.formatObject(t.object)} .`);
        }

        return lines.join('\n');
    }

    private termToString(term: any): string {
        return term?.value ?? String(term);
    }

    private formatObject(term: any): string {
        if (term?.type === 'Literal') {
            let lit = `"${term.value}"`;
            if (term.language) lit += `@${term.language}`;
            else if (term.datatype) lit += `^^<${term.datatype}>`;
            return lit;
        }
        return `<${term?.value ?? String(term)}>`;
    }
}
