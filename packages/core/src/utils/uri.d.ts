/**
 * URI Utilities
 */
/**
 * Extract local name from URI
 * @example getLocalName('http://example.org/pizza#Margherita') => 'Margherita'
 */
export declare function getLocalName(uri: string): string;
/**
 * Extract namespace from URI
 * @example getNamespace('http://example.org/pizza#Margherita') => 'http://example.org/pizza#'
 */
export declare function getNamespace(uri: string): string;
/**
 * Check if string is a valid URI
 */
export declare function isValidURI(str: string): boolean;
export declare function generateBlankNodeId(): string;
//# sourceMappingURL=uri.d.ts.map