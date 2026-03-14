import { graph, parse } from 'rdflib';

export class OWLLoader {
    private store: any;

    constructor() {
        this.store = graph();
    }

    /**
     * Load OWL/RDFS ontology data.  Detects Turtle vs RDF∕XML automatically.
     * @param data  Raw ontology text content
     * @param mimeType  Optional override ('text/turtle' | 'application/rdf+xml')
     */
    async load(data: string, mimeType?: string): Promise<any> {
        const mime = mimeType ?? this.detectMime(data);
        try {
            parse(data, this.store, 'http://example.org/base#', mime);
            return this.store;
        } catch (err) {
            // If the auto-detected format fails, try the other one
            const fallback = mime === 'application/rdf+xml' ? 'text/turtle' : 'application/rdf+xml';
            try {
                this.store = graph();
                parse(data, this.store, 'http://example.org/base#', fallback);
                return this.store;
            } catch {
                throw new Error(`Failed to parse OWL (tried ${mime} and ${fallback}): ${err}`);
            }
        }
    }

    getStore() {
        return this.store;
    }

    /** Heuristic mime-type detection from raw content */
    private detectMime(data: string): string {
        const t = data.trimStart();
        if (
            t.startsWith('@prefix') ||
            t.startsWith('@base') ||
            t.startsWith('#') ||
            /^\s*[<_].*\s+a\s+/m.test(t)
        ) {
            return 'text/turtle';
        }
        return 'application/rdf+xml';
    }
}