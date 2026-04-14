/**
 * RDF Types - Core data structures for RDF graphs
 */
/**
 * Supported RDF serialization formats
 */
export type RDFFormat = 'turtle' | 'rdf-xml' | 'n-triples' | 'n-quads' | 'json-ld';
/**
 * RDF Node types
 */
export type NodeType = 'NamedNode' | 'BlankNode' | 'Literal';
/**
 * Named Node (IRI/URI)
 */
export interface NamedNode {
    type: 'NamedNode';
    value: string;
}
/**
 * Blank Node (anonymous resource)
 */
export interface BlankNode {
    type: 'BlankNode';
    value: string;
}
/**
 * Literal value
 */
export interface Literal {
    type: 'Literal';
    value: string;
    language?: string;
    datatype?: string;
}
/**
 * RDF Term (Subject, Predicate, or Object)
 */
export type Term = NamedNode | BlankNode | Literal;
/**
 * RDF Triple (Subject - Predicate - Object)
 */
export interface Triple {
    subject: NamedNode | BlankNode;
    predicate: NamedNode;
    object: Term;
}
/**
 * RDF Quad (Triple + Graph)
 */
export interface Quad extends Triple {
    graph?: NamedNode | BlankNode;
}
/**
 * Graph Statistics
 */
export interface GraphStats {
    totalTriples: number;
    uniqueSubjects: number;
    uniquePredicates: number;
    uniqueObjects: number;
    literalCount: number;
    iriCount: number;
    blankNodeCount: number;
    topPredicates: PredicateCount[];
}
/**
 * Predicate usage count
 */
export interface PredicateCount {
    predicate: string;
    count: number;
    label?: string;
}
/**
 * RDF Prefix mapping
 */
export interface PrefixMap {
    [prefix: string]: string;
}
//# sourceMappingURL=rdf.d.ts.map