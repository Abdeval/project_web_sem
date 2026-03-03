import { graph, parse, serialize } from 'rdflib';
import { Triple } from '../types';

export class RDFXMLExporter {
  async export(triples: Triple[], baseURI: string = 'https://example.org/'): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const store = graph();
        const lines = triples.map((t) => {
          const s = `<${t.subject}>`;
          const p = `<${t.predicate}>`;
          const o = t.isLiteral
            ? `"${t.object.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
            : `<${t.object}>`;
          return `${s} ${p} ${o} .`;
        });
        parse(lines.join('\n'), store, baseURI, 'text/turtle', (parseErr: any) => {
          if (parseErr) {
            reject(new Error(`[RDFXMLExporter] Build error: ${parseErr.message || parseErr}`));
            return;
          }
          serialize(null, store, baseURI, 'application/rdf+xml', (serErr: any, result?: string) => {
            if (serErr) reject(new Error(`[RDFXMLExporter] Serialize error: ${serErr.message || serErr}`));
            else resolve(result || '');
          });
        });
      } catch (e: any) {
        reject(new Error(`[RDFXMLExporter] Unexpected error: ${e.message}`));
      }
    });
  }
}