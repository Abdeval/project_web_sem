"use strict";
/**
 * RDF Store Implementation (using rdflib.js)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RDFStore = void 0;
const rdflib_1 = require("rdflib");
const namespaces_1 = require("../utils/namespaces");
/**
 * Central RDF Store implementation
 */
class RDFStore {
    store;
    prefixes;
    constructor() {
        this.store = (0, rdflib_1.graph)();
        this.prefixes = { ...namespaces_1.STANDARD_PREFIXES };
    }
    async load(data, format, baseURI = 'https://example.org/') {
        const mimeType = this.formatToMimeType(format);
        return new Promise((resolve, reject) => {
            try {
                (0, rdflib_1.parse)(data, this.store, baseURI, mimeType);
                resolve();
            }
            catch (error) {
                reject(new Error(`Failed to parse ${format}: ${error}`));
            }
        });
    }
    async loadFromFile(filePath) {
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        const data = await fs.readFile(filePath, 'utf-8');
        // Auto-detect format from extension
        const format = this.detectFormat(filePath);
        return this.load(data, format);
    }
    async export(format) {
        const mimeType = this.formatToMimeType(format);
        return new Promise((resolve, reject) => {
            try {
                const serialized = (0, rdflib_1.serialize)(null, this.store, undefined, mimeType);
                if (serialized) {
                    resolve(serialized);
                }
                else {
                    reject(new Error(`Failed to serialize to ${format}`));
                }
            }
            catch (error) {
                reject(new Error(`Failed to serialize to ${format}: ${error}`));
            }
        });
    }
    async exportToFile(filePath, format) {
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        const data = await this.export(format);
        await fs.writeFile(filePath, data, 'utf-8');
    }
    getStats() {
        const statements = this.store.statements;
        const subjects = new Set();
        const predicates = new Set();
        const objects = new Set();
        const predicateCounts = new Map();
        let literalCount = 0;
        let iriCount = 0;
        let blankNodeCount = 0;
        for (const stmt of statements) {
            subjects.add(stmt.subject.value);
            predicates.add(stmt.predicate.value);
            objects.add(stmt.object.value);
            // Count predicate usage
            const predValue = stmt.predicate.value;
            predicateCounts.set(predValue, (predicateCounts.get(predValue) || 0) + 1);
            // Count node types
            if (stmt.object.termType === 'Literal') {
                literalCount++;
            }
            else if (stmt.object.termType === 'NamedNode') {
                iriCount++;
            }
            else if (stmt.object.termType === 'BlankNode') {
                blankNodeCount++;
            }
        }
        // Sort predicates by count
        const topPredicates = Array.from(predicateCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([predicate, count]) => ({ predicate, count }));
        return {
            totalTriples: statements.length,
            uniqueSubjects: subjects.size,
            uniquePredicates: predicates.size,
            uniqueObjects: objects.size,
            literalCount,
            iriCount,
            blankNodeCount,
            topPredicates,
        };
    }
    getTriples() {
        return this.store.statements.map((stmt) => this.statementToTriple(stmt));
    }
    addTriple(triple) {
        const subject = this.termToRdflib(triple.subject);
        const predicate = this.termToRdflib(triple.predicate);
        const object = this.termToRdflib(triple.object);
        this.store.add(subject, predicate, object);
    }
    removeTriple(triple) {
        const subject = this.termToRdflib(triple.subject);
        const predicate = this.termToRdflib(triple.predicate);
        const object = this.termToRdflib(triple.object);
        const stmt = this.store.statements.find((s) => s.subject.equals(subject) && s.predicate.equals(predicate) && s.object.equals(object));
        if (stmt) {
            this.store.remove(stmt);
            return true;
        }
        return false;
    }
    clear() {
        this.store = (0, rdflib_1.graph)();
    }
    getPrefixes() {
        return { ...this.prefixes };
    }
    registerPrefix(prefix, uri) {
        this.prefixes[prefix] = uri;
    }
    /**
     * Get the underlying rdflib store (for advanced usage)
     */
    getStore() {
        return this.store;
    }
    // Helper methods
    formatToMimeType(format) {
        const mimeTypes = {
            turtle: 'text/turtle',
            'rdf-xml': 'application/rdf+xml',
            'n-triples': 'application/n-triples',
            'n-quads': 'application/n-quads',
            'json-ld': 'application/ld+json',
        };
        return mimeTypes[format];
    }
    detectFormat(filePath) {
        const ext = filePath.split('.').pop()?.toLowerCase();
        const formatMap = {
            ttl: 'turtle',
            rdf: 'rdf-xml',
            owl: 'rdf-xml',
            nt: 'n-triples',
            nq: 'n-quads',
            jsonld: 'json-ld',
        };
        return formatMap[ext || ''] || 'turtle';
    }
    statementToTriple(stmt) {
        return {
            subject: this.rdflibToTerm(stmt.subject),
            predicate: this.rdflibToTerm(stmt.predicate),
            object: this.rdflibToTerm(stmt.object),
        };
    }
    rdflibToTerm(node) {
        if (node.termType === 'NamedNode') {
            return { type: 'NamedNode', value: node.value };
        }
        else if (node.termType === 'BlankNode') {
            return { type: 'BlankNode', value: node.value };
        }
        else if (node.termType === 'Literal') {
            return {
                type: 'Literal',
                value: node.value,
                language: node.language || undefined,
                datatype: node.datatype?.value,
            };
        }
        throw new Error(`Unknown node type: ${node.termType}`);
    }
    termToRdflib(term) {
        if (term.type === 'NamedNode') {
            return (0, rdflib_1.sym)(term.value);
        }
        else if (term.type === 'BlankNode') {
            return this.store.bnode(term.value);
        }
        else if (term.type === 'Literal') {
            return (0, rdflib_1.lit)(term.value, term.language, term.datatype ? (0, rdflib_1.sym)(term.datatype) : undefined);
        }
        throw new Error(`Unknown term type: ${term.type}`);
    }
}
exports.RDFStore = RDFStore;
//# sourceMappingURL=RDFStore.js.map