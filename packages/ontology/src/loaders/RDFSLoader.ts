import { graph, parse } from 'rdflib';

export class RDFSLoader {
    private store: any;

    constructor() {
        this.store = graph();
    }

    async load(data: string): Promise<any> {
        // ✅ CORRECTION : parse() est SYNCHRONE
        try {
            parse(
                data,
                this.store,
                'http://example.org/base#',
                'application/rdf+xml'
            );
            return this.store;
        } catch (err) {
            throw new Error(`Failed to parse RDFS: ${err}`);
        }
    }

    getStore() {
        return this.store;
    }
}