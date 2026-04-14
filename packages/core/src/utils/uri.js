"use strict";
/**
 * URI Utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalName = getLocalName;
exports.getNamespace = getNamespace;
exports.isValidURI = isValidURI;
exports.generateBlankNodeId = generateBlankNodeId;
/**
 * Extract local name from URI
 * @example getLocalName('http://example.org/pizza#Margherita') => 'Margherita'
 */
function getLocalName(uri) {
    // Try # first, then /
    const hashIndex = uri.lastIndexOf('#');
    if (hashIndex !== -1) {
        return uri.slice(hashIndex + 1);
    }
    const slashIndex = uri.lastIndexOf('/');
    if (slashIndex !== -1) {
        return uri.slice(slashIndex + 1);
    }
    return uri;
}
/**
 * Extract namespace from URI
 * @example getNamespace('http://example.org/pizza#Margherita') => 'http://example.org/pizza#'
 */
function getNamespace(uri) {
    const hashIndex = uri.lastIndexOf('#');
    if (hashIndex !== -1) {
        return uri.slice(0, hashIndex + 1);
    }
    const slashIndex = uri.lastIndexOf('/');
    if (slashIndex !== -1) {
        return uri.slice(0, slashIndex + 1);
    }
    return uri;
}
/**
 * Check if string is a valid URI
 */
function isValidURI(str) {
    try {
        new URL(str);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Generate a blank node ID
 */
let blankNodeCounter = 0;
function generateBlankNodeId() {
    return `_:b${blankNodeCounter++}`;
}
//# sourceMappingURL=uri.js.map