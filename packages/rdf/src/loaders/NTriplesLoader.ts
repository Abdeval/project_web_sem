import * as N3 from 'n3';
import { Triple } from '../types';

export class NTriplesLoader {
  async load(data: string): Promise<Triple[]> {
    return new Promise((resolve, reject) => {
      const parser = new N3.Parser({ format: 'N-Triples' });
      const triples: Triple[] = [];
      try {
        parser.parse(data, (error, quad) => {
          if (error) {
            reject(new Error(`[NTriplesLoader] Parse error: ${error.message}`));
            return;
          }
          if (quad) {
            triples.push({
              subject: quad.subject.value,
              predicate: quad.predicate.value,
              object: quad.object.value,
              isLiteral: quad.object.termType === 'Literal',
            });
          } else {
            resolve(triples);
          }
        });
      } catch (e: any) {
        reject(new Error(`[NTriplesLoader] Unexpected error: ${e.message}`));
      }
    });
  }
}