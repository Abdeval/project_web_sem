/**
 * Standard RDF/OWL Namespaces
 */
export declare const NAMESPACES: {
    readonly RDF: "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
    readonly RDFS: "http://www.w3.org/2000/01/rdf-schema#";
    readonly OWL: "http://www.w3.org/2002/07/owl#";
    readonly XSD: "http://www.w3.org/2001/XMLSchema#";
    readonly FOAF: "http://xmlns.com/foaf/0.1/";
    readonly DC: "http://purl.org/dc/elements/1.1/";
    readonly DCTERMS: "http://purl.org/dc/terms/";
    readonly SKOS: "http://www.w3.org/2004/02/skos/core#";
};
/**
 * Standard prefix mappings
 */
export declare const STANDARD_PREFIXES: Record<string, string>;
/**
 * Get full URI from prefixed name
 * @example expandPrefix('rdf:type') => 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
 */
export declare function expandPrefix(prefixed: string, customPrefixes?: Record<string, string>): string;
/**
 * Get prefixed name from full URI
 * @example compactURI('http://www.w3.org/1999/02/22-rdf-syntax-ns#type') => 'rdf:type'
 */
export declare function compactURI(uri: string, customPrefixes?: Record<string, string>): string;
//# sourceMappingURL=namespaces.d.ts.map