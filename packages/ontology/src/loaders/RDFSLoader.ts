import { graph, parse } from 'rdflib';

export class RDFSLoader {
    private store: any;

    constructor() {
        this.store = graph();
    }

    async load(data: string): Promise<any> {
        const mime = this.detectMime(data);
        try {
            parse(data, this.store, 'http://example.org/base#', mime);
            return this.store;
        } catch (err) {
            // Try the other format as fallback
            const fallback = mime === 'application/rdf+xml' ? 'text/turtle' : 'application/rdf+xml';
            try {
                this.store = graph();
                parse(data, this.store, 'http://example.org/base#', fallback);
                return this.store;
            } catch {
                throw new Error(`Failed to parse RDFS (tried ${mime} and ${fallback}): ${err}`);
            }
        }
    }

    getStore() {
        return this.store;
    }

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