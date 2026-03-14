/**
 * SPARQL Engine - Orchestrates query parsing and execution
 */

import { Parser } from 'sparqljs';
import { IRDFStore, QueryResult } from '@kg/core';
import { SelectQuery } from './SelectQuery';
import { ConstructQuery } from './ConstructQuery';
import { AskQuery } from './AskQuery';

export class SPARQLEngine {
    private parser: InstanceType<typeof Parser>;
    private selectQuery: SelectQuery;
    private constructQuery: ConstructQuery;
    private askQuery: AskQuery;

    constructor() {
        this.parser = new Parser({
            prefixes: {
                rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
                rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
                owl: 'http://www.w3.org/2002/07/owl#',
                xsd: 'http://www.w3.org/2001/XMLSchema#',
                dc: 'http://purl.org/dc/elements/1.1/',
                dcterms: 'http://purl.org/dc/terms/',
                skos: 'http://www.w3.org/2004/02/skos/core#',
                foaf: 'http://xmlns.com/foaf/0.1/',
                schema: 'https://schema.org/',
            },
        });
        this.selectQuery = new SelectQuery();
        this.constructQuery = new ConstructQuery();
        this.askQuery = new AskQuery();
    }

    /**
     * Execute a SPARQL query against the given store.
     */
    async execute(query: string, store: IRDFStore): Promise<QueryResult> {
        let parsed: any;
        try {
            parsed = this.parser.parse(query);
        } catch (err: any) {
            throw new Error(`SPARQL Parse Error: ${err.message}`);
        }

        if (!('queryType' in parsed)) {
            throw new Error('UPDATE queries are not supported');
        }

        const queryType: string = (parsed.queryType as string).toUpperCase();

        switch (queryType) {
            case 'SELECT':
                return this.selectQuery.execute(parsed, store);
            case 'CONSTRUCT':
                return this.constructQuery.execute(parsed, store);
            case 'ASK':
                return this.askQuery.execute(parsed, store);
            default:
                throw new Error(`Unsupported query type: ${queryType}`);
        }
    }

    /**
     * Validate SPARQL syntax without executing.
     */
    validate(query: string): { valid: boolean; error?: string } {
        try {
            this.parser.parse(query);
            return { valid: true };
        } catch (err: any) {
            return { valid: false, error: err.message };
        }
    }

    /**
     * Detect query type without full execution.
     */
    detectType(query: string): 'SELECT' | 'CONSTRUCT' | 'ASK' | 'DESCRIBE' | 'UNKNOWN' {
        try {
            const parsed = this.parser.parse(query);
            if ('queryType' in parsed) {
                return (parsed.queryType as string).toUpperCase() as any;
            }
            return 'UNKNOWN';
        } catch {
            return 'UNKNOWN';
        }
    }
}
