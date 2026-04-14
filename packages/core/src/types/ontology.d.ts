/**
 * Ontology Types - OWL/RDFS structures
 */
/**
 * OWL/RDFS Class
 */
export interface ClassNode {
    uri: string;
    label?: string;
    comment?: string;
    deprecated?: boolean;
    subClassOf: string[];
    equivalentClass?: string[];
    disjointWith?: string[];
    children: ClassNode[];
}
/**
 * Property types in OWL
 */
export type PropertyType = 'ObjectProperty' | 'DatatypeProperty' | 'AnnotationProperty' | 'Property';
/**
 * OWL/RDFS Property
 */
export interface PropertyNode {
    uri: string;
    label?: string;
    comment?: string;
    type: PropertyType;
    domain: string[];
    range: string[];
    subPropertyOf: string[];
    inverseOf?: string;
    functional?: boolean;
    inverseFunctional?: boolean;
    transitive?: boolean;
    symmetric?: boolean;
    children: PropertyNode[];
}
/**
 * Ontology Structure (complete view)
 */
export interface OntologyStructure {
    uri?: string;
    version?: string;
    imports: string[];
    classes: ClassNode[];
    properties: PropertyNode[];
    classHierarchy: ClassNode;
    propertyHierarchy: PropertyNode;
}
/**
 * Ontology Metrics
 */
export interface OntologyMetrics {
    totalClasses: number;
    totalObjectProperties: number;
    totalDatatypeProperties: number;
    totalAnnotationProperties: number;
    maxDepth: number;
    axiomCount: number;
}
//# sourceMappingURL=ontology.d.ts.map