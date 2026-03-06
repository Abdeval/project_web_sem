/**
 * XMLExporter - Exports SELECT results to SPARQL Query Results XML Format (W3C)
 * https://www.w3.org/TR/rdf-sparql-XMLres/
 */

import { QueryResult } from '@kg/core';

export class XMLExporter {
    export(result: QueryResult): string {
        if (result.type === 'ASK') {
            return this.exportAsk(result);
        }
        if (result.type !== 'SELECT') {
            throw new Error(`XML export not supported for query type: ${result.type}`);
        }
        return this.exportSelect(result);
    }

    private exportSelect(result: QueryResult): string {
        const vars = result.variables ?? [];
        const bindings = result.bindings ?? [];

        const lines: string[] = [];
        lines.push('<?xml version="1.0" encoding="UTF-8"?>');
        lines.push('<sparql xmlns="http://www.w3.org/2005/sparql-results#">');
        lines.push('  <head>');
        for (const v of vars) {
            lines.push(`    <variable name="${this.escapeXML(v)}"/>`);
        }
        lines.push('  </head>');
        lines.push('  <results>');

        for (const row of bindings) {
            lines.push('    <result>');
            for (const v of vars) {
                const val = row[v];
                if (val !== undefined && val !== '') {
                    lines.push(`      <binding name="${this.escapeXML(v)}">`);
                    lines.push(`        ${this.termToXML(val)}`);
                    lines.push(`      </binding>`);
                }
            }
            lines.push('    </result>');
        }

        lines.push('  </results>');
        lines.push('</sparql>');

        return lines.join('\n');
    }

    private exportAsk(result: QueryResult): string {
        const val = result.boolean ? 'true' : 'false';
        return [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<sparql xmlns="http://www.w3.org/2005/sparql-results#">',
            '  <head/>',
            `  <boolean>${val}</boolean>`,
            '</sparql>',
        ].join('\n');
    }

    private termToXML(term: any): string {
        if (typeof term === 'string') {
            return `<literal>${this.escapeXML(term)}</literal>`;
        }
        if (!term) return '<literal/>';

        if (term.type === 'NamedNode') {
            return `<uri>${this.escapeXML(term.value)}</uri>`;
        }
        if (term.type === 'BlankNode') {
            return `<bnode>${this.escapeXML(term.value)}</bnode>`;
        }
        if (term.type === 'Literal') {
            let attrs = '';
            if (term.language) attrs = ` xml:lang="${this.escapeXML(term.language)}"`;
            else if (term.datatype) attrs = ` datatype="${this.escapeXML(term.datatype)}"`;
            return `<literal${attrs}>${this.escapeXML(term.value)}</literal>`;
        }
        return `<literal>${this.escapeXML(String(term.value ?? term))}</literal>`;
    }

    private escapeXML(s: string): string {
        return s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
}
