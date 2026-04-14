"use strict";
/**
 * Core Package - Shared types and interfaces
 *
 * This package defines all shared types, interfaces, and base implementations
 * used across the Knowledge Graph Desktop application.
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// RDF Types
__exportStar(require("./types/rdf"), exports);
__exportStar(require("./types/ontology"), exports);
__exportStar(require("./types/query"), exports);
__exportStar(require("./types/reasoning"), exports);
__exportStar(require("./types/graph"), exports);
__exportStar(require("./types/embeddings"), exports);
// Interfaces
__exportStar(require("./interfaces"), exports);
// Store implementation
__exportStar(require("./store/RDFStore"), exports);
// Utilities
__exportStar(require("./utils/namespaces"), exports);
__exportStar(require("./utils/uri"), exports);
//# sourceMappingURL=index.js.map