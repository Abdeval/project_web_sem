/**
 * SPARQL Query Types
 */
import { Triple } from './rdf';
/**
 * SPARQL Query types
 */
export type QueryType = 'SELECT' | 'CONSTRUCT' | 'ASK' | 'DESCRIBE';
/**
 * Variable binding (for SELECT results)
 */
export interface Binding {
    [variable: string]: string | number | boolean;
}
/**
 * SPARQL Query Result
 */
export interface QueryResult {
    type: QueryType;
    variables?: string[];
    bindings?: Binding[];
    triples?: Triple[];
    boolean?: boolean;
    executionTime?: number;
    count?: number;
}
/**
 * Query History Entry
 */
export interface QueryHistoryEntry {
    id: string;
    query: string;
    timestamp: Date;
    result: QueryResult;
    error?: string;
}
/**
 * SPARQL Endpoint Configuration
 */
export interface SPARQLEndpoint {
    url: string;
    type: 'local' | 'remote';
    authentication?: {
        username: string;
        password: string;
    };
}
//# sourceMappingURL=query.d.ts.map