/**
 * Core Interfaces - Contracts for all modules
 */
import { Triple, RDFFormat, GraphStats, PrefixMap } from '../types/rdf';
import { OntologyStructure, ClassNode, PropertyNode } from '../types/ontology';
import { QueryResult } from '../types/query';
import { ReasoningConfig, ReasoningResult, InferredTriple, ReasoningMode } from '../types/reasoning';
import { EmbeddingAlgorithm, EmbeddingComparisonResult, EmbeddingTrainingConfig, EmbeddingTrainingResult } from '../types/embeddings';
/**
 * RDF Store Interface
 * Implemented by: packages/rdf
 */
export interface IRDFStore {
    /**
     * Load RDF data from string
     */
    load(data: string, format: RDFFormat, baseURI?: string): Promise<void>;
    /**
     * Load RDF data from file path
     */
    loadFromFile(filePath: string): Promise<void>;
    /**
     * Export RDF data to string
     */
    export(format: RDFFormat): Promise<string>;
    /**
     * Export RDF data to file
     */
    exportToFile(filePath: string, format: RDFFormat): Promise<void>;
    /**
     * Get graph statistics
     */
    getStats(): GraphStats;
    /**
     * Get all triples
     */
    getTriples(): Triple[];
    /**
     * Add a triple
     */
    addTriple(triple: Triple): void;
    /**
     * Remove a triple
     */
    removeTriple(triple: Triple): boolean;
    /**
     * Clear all data
     */
    clear(): void;
    /**
     * Get registered prefixes
     */
    getPrefixes(): PrefixMap;
    /**
     * Register a prefix
     */
    registerPrefix(prefix: string, uri: string): void;
}
/**
 * Ontology Store Interface
 * Implemented by: packages/ontology
 */
export interface IOntologyStore {
    /**
     * Load an ontology
     */
    loadOntology(data: string, format: 'owl' | 'rdfs'): Promise<void>;
    /**
     * Get all classes
     */
    getClasses(): ClassNode[];
    /**
     * Get all properties
     */
    getProperties(): PropertyNode[];
    /**
     * Get class hierarchy (tree structure)
     */
    getClassHierarchy(): ClassNode;
    /**
     * Get property hierarchy (tree structure)
     */
    getPropertyHierarchy(): PropertyNode;
    /**
     * Get complete ontology structure
     */
    getStructure(): OntologyStructure;
    /**
     * Find a class by URI
     */
    findClass(uri: string): ClassNode | undefined;
    /**
     * Find a property by URI
     */
    findProperty(uri: string): PropertyNode | undefined;
}
/**
 * Query Engine Interface
 * Implemented by: packages/sparql
 */
export interface IQueryEngine {
    /**
     * Execute a SPARQL query
     */
    execute(query: string, store: IRDFStore): Promise<QueryResult>;
    /**
     * Validate SPARQL query syntax
     */
    validate(query: string): {
        valid: boolean;
        error?: string;
    };
    /**
     * Get query history
     */
    getHistory(): any[];
    /**
     * Clear query history
     */
    clearHistory(): void;
    /**
     * Export query result
     */
    exportResult(result: QueryResult, format: 'csv' | 'json' | 'xml'): Promise<string>;
}
/**
 * Reasoning Engine Interface
 * Implemented by: packages/reasoning
 */
export interface IReasoningEngine {
    /**
     * Configure reasoning
     */
    configure(config: ReasoningConfig): void;
    /**
     * Get current configuration
     */
    getConfig(): ReasoningConfig;
    /**
     * Enable/disable reasoning
     */
    setEnabled(enabled: boolean): void;
    /**
     * Perform inference on the RDF store
     */
    infer(store: IRDFStore): Promise<ReasoningResult>;
    /**
     * Get all inferred triples
     */
    getInferredTriples(): InferredTriple[];
    /**
     * Clear cached inferences
     */
    clearInferences(): void;
    /**
     * Check ontology consistency
     */
    checkConsistency(store: IRDFStore): Promise<boolean>;
    /**
     * Get list of supported reasoning modes
     */
    getSupportedModes(): ReasoningMode[];
}
/**
 * Embedding Engine Interface
 * Implemented by: packages/embeddings
 */
export interface IEmbeddingEngine {
    /**
     * Configure default training options.
     */
    configure(config: Partial<EmbeddingTrainingConfig>): void;
    /**
     * Get current default configuration.
     */
    getConfig(): Partial<EmbeddingTrainingConfig>;
    /**
     * Train a single embedding model.
     */
    train(store: IRDFStore, config: EmbeddingTrainingConfig): Promise<EmbeddingTrainingResult>;
    /**
     * Compare two algorithms with common settings.
     */
    compare(store: IRDFStore, configA: EmbeddingTrainingConfig, configB: EmbeddingTrainingConfig): Promise<EmbeddingComparisonResult>;
    /**
     * Supported algorithms by the current engine implementation.
     */
    getSupportedAlgorithms(): EmbeddingAlgorithm[];
}
//# sourceMappingURL=index.d.ts.map