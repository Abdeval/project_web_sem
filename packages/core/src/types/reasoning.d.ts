/**
 * Reasoning Types - Inference engine configuration
 */
import { Triple } from './rdf';
/**
 * Reasoning modes/formalisms
 */
export type ReasoningMode = 'RDFS' | 'OWL_RL' | 'OWL_EL' | 'OWL_QL' | 'OWL_DL' | 'NONE';
/**
 * Inferred Triple (with provenance)
 */
export interface InferredTriple extends Triple {
    inferred: true;
    rule?: string;
    source?: Triple[];
}
/**
 * Reasoning Configuration
 */
export interface ReasoningConfig {
    enabled: boolean;
    mode: ReasoningMode;
    includeInferred: boolean;
    maxInferences?: number;
}
/**
 * Reasoning Result
 */
export interface ReasoningResult {
    inferredTriples: InferredTriple[];
    totalInferences: number;
    executionTime: number;
    consistencyCheck: boolean;
    errors?: string[];
}
/**
 * Supported reasoner engines
 */
export type ReasonerEngine = 'jena' | 'pellet' | 'hermit' | 'elk' | 'built-in';
//# sourceMappingURL=reasoning.d.ts.map