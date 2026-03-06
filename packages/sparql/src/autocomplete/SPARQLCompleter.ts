/**
 * SPARQLCompleter - SPARQL auto-completion suggestions
 */

import { IRDFStore } from '@kg/core';

export interface CompletionItem {
    label: string;
    kind: 'prefix' | 'keyword' | 'variable' | 'uri';
    insertText: string;
    documentation?: string;
}

const SPARQL_KEYWORDS: CompletionItem[] = [
    { label: 'SELECT', kind: 'keyword', insertText: 'SELECT ', documentation: 'Select query' },
    { label: 'CONSTRUCT', kind: 'keyword', insertText: 'CONSTRUCT {\n  \n} WHERE {\n  \n}', documentation: 'Construct query' },
    { label: 'ASK', kind: 'keyword', insertText: 'ASK {\n  \n}', documentation: 'Ask query' },
    { label: 'DESCRIBE', kind: 'keyword', insertText: 'DESCRIBE ', documentation: 'Describe query' },
    { label: 'WHERE', kind: 'keyword', insertText: 'WHERE {\n  \n}', documentation: 'Where clause' },
    { label: 'FILTER', kind: 'keyword', insertText: 'FILTER()', documentation: 'Filter expression' },
    { label: 'OPTIONAL', kind: 'keyword', insertText: 'OPTIONAL {\n  \n}', documentation: 'Optional pattern' },
    { label: 'UNION', kind: 'keyword', insertText: 'UNION {\n  \n}', documentation: 'Union pattern' },
    { label: 'ORDER BY', kind: 'keyword', insertText: 'ORDER BY ', documentation: 'Order results' },
    { label: 'LIMIT', kind: 'keyword', insertText: 'LIMIT ', documentation: 'Limit results' },
    { label: 'OFFSET', kind: 'keyword', insertText: 'OFFSET ', documentation: 'Offset results' },
    { label: 'DISTINCT', kind: 'keyword', insertText: 'DISTINCT ', documentation: 'Remove duplicates' },
    { label: 'GROUP BY', kind: 'keyword', insertText: 'GROUP BY ', documentation: 'Group results' },
    { label: 'HAVING', kind: 'keyword', insertText: 'HAVING()', documentation: 'Having clause' },
    { label: 'ASC', kind: 'keyword', insertText: 'ASC()', documentation: 'Ascending order' },
    { label: 'DESC', kind: 'keyword', insertText: 'DESC()', documentation: 'Descending order' },
];

const STANDARD_PREFIXES: CompletionItem[] = [
    { label: 'PREFIX rdf:', kind: 'prefix', insertText: 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>', documentation: 'RDF namespace' },
    { label: 'PREFIX rdfs:', kind: 'prefix', insertText: 'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>', documentation: 'RDFS namespace' },
    { label: 'PREFIX owl:', kind: 'prefix', insertText: 'PREFIX owl: <http://www.w3.org/2002/07/owl#>', documentation: 'OWL namespace' },
    { label: 'PREFIX foaf:', kind: 'prefix', insertText: 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>', documentation: 'FOAF namespace' },
    { label: 'PREFIX xsd:', kind: 'prefix', insertText: 'PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>', documentation: 'XSD namespace' },
    { label: 'PREFIX dc:', kind: 'prefix', insertText: 'PREFIX dc: <http://purl.org/dc/elements/1.1/>', documentation: 'Dublin Core namespace' },
    { label: 'PREFIX dcterms:', kind: 'prefix', insertText: 'PREFIX dcterms: <http://purl.org/dc/terms/>', documentation: 'DC Terms namespace' },
    { label: 'PREFIX skos:', kind: 'prefix', insertText: 'PREFIX skos: <http://www.w3.org/2004/02/skos/core#>', documentation: 'SKOS namespace' },
    { label: 'PREFIX schema:', kind: 'prefix', insertText: 'PREFIX schema: <http://schema.org/>', documentation: 'Schema.org namespace' },
];

export class SPARQLCompleter {
    /**
     * Get completions based on the current text and cursor position.
     */
    getCompletions(text: string, cursorPos: number, _store?: IRDFStore): CompletionItem[] {
        const textUpToCursor = text.slice(0, cursorPos);
        const lastToken = this.getLastToken(textUpToCursor);

        const items: CompletionItem[] = [];

        // Prefix suggestions
        if (lastToken.startsWith('PREFIX ') || textUpToCursor.trim() === '' || lastToken === '') {
            items.push(...STANDARD_PREFIXES);
        }

        // Prefix shortcuts (rdf:, rdfs:, owl:, foaf:)
        if (this.isPrefixContext(lastToken)) {
            const prefix = lastToken.split(':')[0];
            items.push(...this.getPrefixedTerms(prefix));
        }

        // Variable suggestions from already written variables in the query
        if (lastToken.startsWith('?') || lastToken.startsWith('$')) {
            const vars = this.extractVariables(text);
            for (const v of vars) {
                const varName = v.replace(/^[?$]/, '');
                items.push({
                    label: `?${varName}`,
                    kind: 'variable',
                    insertText: `?${varName}`,
                    documentation: 'Used variable',
                });
            }
        }

        // Keyword suggestions
        if (this.isKeywordContext(textUpToCursor, lastToken)) {
            items.push(...SPARQL_KEYWORDS);
        }

        return items;
    }

    /**
     * Get all prefix suggestions.
     */
    getPrefixSuggestions(): CompletionItem[] {
        return [...STANDARD_PREFIXES];
    }

    /**
     * Get all keyword suggestions.
     */
    getKeywordSuggestions(): CompletionItem[] {
        return [...SPARQL_KEYWORDS];
    }

    /**
     * Extract variable names from query text.
     */
    extractVariables(text: string): string[] {
        const matches = text.match(/[?$][a-zA-Z_][a-zA-Z0-9_]*/g) ?? [];
        return [...new Set(matches)];
    }

    private getLastToken(text: string): string {
        const parts = text.split(/\s+/);
        return parts[parts.length - 1] ?? '';
    }

    private isPrefixContext(token: string): boolean {
        return /^(rdf|rdfs|owl|foaf|xsd|dc|dcterms|skos|schema):/.test(token);
    }

    private isKeywordContext(_textUpToCursor: string, lastToken: string): boolean {
        // Show keywords at the start or after specific contexts
        const keywords = ['SELECT', 'WHERE', 'CONSTRUCT', 'ASK', 'FROM', 'FILTER', 'OPTIONAL', 'UNION', 'ORDER', 'LIMIT', 'OFFSET'];
        return !keywords.some((k) => lastToken.toUpperCase() === k);
    }

    private getPrefixedTerms(prefix: string): CompletionItem[] {
        const prefixTerms: Record<string, string[]> = {
            rdf: ['type', 'Property', 'Statement', 'subject', 'predicate', 'object', 'Bag', 'Seq', 'Alt', 'nil'],
            rdfs: ['Class', 'subClassOf', 'subPropertyOf', 'label', 'comment', 'domain', 'range', 'Resource', 'Literal', 'isDefinedBy', 'seeAlso'],
            owl: ['Class', 'ObjectProperty', 'DatatypeProperty', 'Thing', 'Nothing', 'equivalentClass', 'equivalentProperty', 'sameAs', 'differentFrom', 'inverseOf', 'TransitiveProperty', 'SymmetricProperty'],
            foaf: ['Person', 'Agent', 'name', 'mbox', 'knows', 'homepage', 'depiction', 'Organization', 'Project', 'Document', 'Image', 'age', 'gender'],
            xsd: ['string', 'integer', 'decimal', 'float', 'double', 'boolean', 'date', 'dateTime', 'time', 'gYear', 'anyURI'],
        };

        const terms = prefixTerms[prefix] ?? [];
        return terms.map((t) => ({
            label: `${prefix}:${t}`,
            kind: 'uri' as const,
            insertText: `${prefix}:${t}`,
            documentation: `${prefix} term`,
        }));
    }
}
