"use strict";
/**
 * Standard RDF/OWL Namespaces
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.STANDARD_PREFIXES = exports.NAMESPACES = void 0;
exports.expandPrefix = expandPrefix;
exports.compactURI = compactURI;
exports.NAMESPACES = {
    RDF: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    RDFS: 'http://www.w3.org/2000/01/rdf-schema#',
    OWL: 'http://www.w3.org/2002/07/owl#',
    XSD: 'http://www.w3.org/2001/XMLSchema#',
    FOAF: 'http://xmlns.com/foaf/0.1/',
    DC: 'http://purl.org/dc/elements/1.1/',
    DCTERMS: 'http://purl.org/dc/terms/',
    SKOS: 'http://www.w3.org/2004/02/skos/core#',
};
/**
 * Standard prefix mappings
 */
exports.STANDARD_PREFIXES = {
    rdf: exports.NAMESPACES.RDF,
    rdfs: exports.NAMESPACES.RDFS,
    owl: exports.NAMESPACES.OWL,
    xsd: exports.NAMESPACES.XSD,
    foaf: exports.NAMESPACES.FOAF,
    dc: exports.NAMESPACES.DC,
    dcterms: exports.NAMESPACES.DCTERMS,
    skos: exports.NAMESPACES.SKOS,
};
/**
 * Get full URI from prefixed name
 * @example expandPrefix('rdf:type') => 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
 */
function expandPrefix(prefixed, customPrefixes) {
    const [prefix, localName] = prefixed.split(':');
    if (!localName)
        return prefixed; // Not a prefixed name
    const prefixes = { ...exports.STANDARD_PREFIXES, ...customPrefixes };
    const namespace = prefixes[prefix];
    if (!namespace) {
        throw new Error(`Unknown prefix: ${prefix}`);
    }
    return namespace + localName;
}
/**
 * Get prefixed name from full URI
 * @example compactURI('http://www.w3.org/1999/02/22-rdf-syntax-ns#type') => 'rdf:type'
 */
function compactURI(uri, customPrefixes) {
    const prefixes = { ...exports.STANDARD_PREFIXES, ...customPrefixes };
    for (const [prefix, namespace] of Object.entries(prefixes)) {
        if (uri.startsWith(namespace)) {
            return `${prefix}:${uri.slice(namespace.length)}`;
        }
    }
    return uri; // No matching prefix
}
//# sourceMappingURL=namespaces.js.map