/**
 * RDF Store Implementation (using rdflib.js)
 */
import { Store } from 'rdflib';
import { IRDFStore } from '../interfaces';
import { Triple, RDFFormat, GraphStats, PrefixMap } from '../types/rdf';
/**
 * Central RDF Store implementation
 */
export declare class RDFStore implements IRDFStore {
    private store;
    private prefixes;
    constructor();
    load(data: string, format: RDFFormat, baseURI?: string): Promise<void>;
    loadFromFile(filePath: string): Promise<void>;
    export(format: RDFFormat): Promise<string>;
    exportToFile(filePath: string, format: RDFFormat): Promise<void>;
    getStats(): GraphStats;
    getTriples(): Triple[];
    addTriple(triple: Triple): void;
    removeTriple(triple: Triple): boolean;
    clear(): void;
    getPrefixes(): PrefixMap;
    registerPrefix(prefix: string, uri: string): void;
    /**
     * Get the underlying rdflib store (for advanced usage)
     */
    getStore(): Store;
    private formatToMimeType;
    private detectFormat;
    private statementToTriple;
    private rdflibToTerm;
    private termToRdflib;
}
//# sourceMappingURL=RDFStore.d.ts.map