import { graph, parse } from 'rdflib';
import { Triple } from '../types';

export class RDFXMLLoader {
  async load(data: string, baseURI: string = 'https://example.org/'): Promise<Triple[]> {
    return new Promise((resolve, reject) => {
      const store = graph();
      try {
        parse(data, store, baseURI, 'application/rdf+xml', (err: any) => {
          if (err) {
            reject(new Error('[RDFXMLLoader] Parse error: ' + (err.message || err)));
            return;
          }
          const triples: Triple[] = [];
          store.match(undefined, undefined, undefined).forEach((quad: any) => {
            triples.push({
              subject: quad.subject.value,
              predicate: quad.predicate.value,
              object: quad.object.value,
              isLiteral: quad.object.termType === 'Literal',
            });
          });
          resolve(triples);
        });
      } catch (e: any) {
        reject(new Error('[RDFXMLLoader] Unexpected error: ' + e.message));
      }
    });
  }
}
