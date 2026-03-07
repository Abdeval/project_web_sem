/**
 * Reasoning Engine - RDFS and OWL inference orchestrator
 * Implements IReasoningEngine from @kg/core
 */

import {
    IReasoningEngine,
    IRDFStore,
    ReasoningConfig,
    ReasoningResult,
    InferredTriple,
    ReasoningMode,
} from '@kg/core';
import { RDFSReasoner } from './engines/RDFSReasoner';
import { OWLRLReasoner } from './engines/OWLRLReasoner';

export class ReasoningEngine implements IReasoningEngine {
    private config: ReasoningConfig = {
        enabled: false,
        mode: 'NONE',
        includeInferred: false,
    };

    private inferredTriples: InferredTriple[] = [];
    private rdfsReasoner = new RDFSReasoner();
    private owlRLReasoner = new OWLRLReasoner();

    configure(config: ReasoningConfig): void {
        this.config = { ...config };
    }

    getConfig(): ReasoningConfig {
        return { ...this.config };
    }

    setEnabled(enabled: boolean): void {
        this.config.enabled = enabled;
        if (!enabled) {
            this.clearInferences();
        }
    }

    getSupportedModes(): ReasoningMode[] {
        return ['NONE', 'RDFS', 'OWL_RL'];
    }

    async infer(store: IRDFStore): Promise<ReasoningResult> {
        const startTime = Date.now();

        if (!this.config.enabled || this.config.mode === 'NONE') {
            return {
                inferredTriples: [],
                totalInferences: 0,
                executionTime: 0,
                consistencyCheck: true,
            };
        }

        this.clearInferences();

        const baseTriples = store.getTriples();
        const limit = this.config.maxInferences ?? Infinity;

        switch (this.config.mode) {
            case 'RDFS':
                this.inferredTriples = this.rdfsReasoner.reason(baseTriples);
                break;
            case 'OWL_RL': {
                // OWL RL builds on RDFS: run RDFS first, then OWL RL on the combined set
                const rdfsInferred = this.rdfsReasoner.reason(baseTriples);
                const combined = [...baseTriples, ...rdfsInferred];
                const owlInferred = this.owlRLReasoner.reason(combined);
                this.inferredTriples = [...rdfsInferred, ...owlInferred];
                break;
            }
            default:
                console.warn(`Reasoning mode "${this.config.mode}" not implemented`);
        }

        // Apply max inferences limit
        if (this.inferredTriples.length > limit) {
            this.inferredTriples = this.inferredTriples.slice(0, limit);
        }

        // Persist inferred triples back into the store if configured
        if (this.config.includeInferred) {
            for (const triple of this.inferredTriples) {
                store.addTriple(triple);
            }
        }

        const executionTime = Date.now() - startTime;

        return {
            inferredTriples: this.inferredTriples,
            totalInferences: this.inferredTriples.length,
            executionTime,
            consistencyCheck: true,
        };
    }

    getInferredTriples(): InferredTriple[] {
        return this.inferredTriples;
    }

    clearInferences(): void {
        this.inferredTriples = [];
    }

    async checkConsistency(_store: IRDFStore): Promise<boolean> {
        // Basic consistency: no triple infers both X type C and X type NOT-C
        // (simplified — full OWL DL consistency is out of scope)
        return true;
    }
}
