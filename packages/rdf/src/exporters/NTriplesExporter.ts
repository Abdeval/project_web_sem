import * as N3 from 'n3';
import { Triple } from '../types';

export class NTriplesExporter {
  async export(triples: Triple[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const writer = new N3.Writer({ format: 'N-Triples' });
      try {
        for (const triple of triples) {
          const s = N3.DataFactory.namedNode(triple.subject);
          const p = N3.DataFactory.namedNode(triple.predicate);
          const o = triple.isLiteral
            ? N3.DataFactory.literal(triple.object)
            : N3.DataFactory.namedNode(triple.object);
          writer.addQuad(s, p, o);
        }
        writer.end((error, result) => {
          if (error) reject(new Error(`[NTriplesExporter] Write error: ${error.message}`));
          else resolve(result);
        });
      } catch (e: any) {
        reject(new Error(`[NTriplesExporter] Unexpected error: ${e.message}`));
      }
    });
  }
}