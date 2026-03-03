import * as N3 from 'n3';
import { Triple } from '../types';

export class TurtleLoader {
  async load(data: string): Promise<Triple[]> {
    return new Promise((resolve, reject) => {
      const parser = new N3.Parser({ format: 'Turtle' });
      const triples: Triple[] = [];
      try {
        parser.parse(data, (error, quad) => {
          if (error) {
            reject(new Error(`[TurtleLoader] Parse error: ${error.message}`));
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
        reject(new Error(`[TurtleLoader] Unexpected error: ${e.message}`));
      }
    });
  }
}