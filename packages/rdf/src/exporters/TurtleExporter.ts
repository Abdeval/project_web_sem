import * as N3 from 'n3';
import { Triple } from '../types';

const PREFIXES: Record<string, string> = {
  rdf:  'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  owl:  'http://www.w3.org/2002/07/owl#',
  xsd:  'http://www.w3.org/2001/XMLSchema#',
  foaf: 'http://xmlns.com/foaf/0.1/',
  dc:   'http://purl.org/dc/elements/1.1/',
};

export class TurtleExporter {
  async export(triples: Triple[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const writer = new N3.Writer({ prefixes: PREFIXES, format: 'Turtle' });
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
          if (error) reject(new Error(`[TurtleExporter] Write error: ${error.message}`));
          else resolve(result);
        });
      } catch (e: any) {
        reject(new Error(`[TurtleExporter] Unexpected error: ${e.message}`));
      }
    });
  }
}