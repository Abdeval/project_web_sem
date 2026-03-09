import { graph, parse } from 'rdflib';

export class OWLLoader {
    private store: any;

    constructor() {
        this.store = graph();
    }

    async load(data: string): Promise<any> {
        // ✅ CORRECTION : parse() est SYNCHRONE dans rdflib v2.x
        // Pas besoin de Promise ni de callback
        try {
            parse(
                data,
                this.store,
                'http://example.org/base#',
                'application/rdf+xml'
            );
            return this.store;
        } catch (err) {
            throw new Error(`Failed to parse OWL: ${err}`);
        }
    }

    getStore() {
        return this.store;
    }
}