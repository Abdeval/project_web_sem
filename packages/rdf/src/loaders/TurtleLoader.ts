import * as N3 from 'n3';
import { Triple } from '../types';

// Common prefixes auto-injected when missing from the source document
const COMMON_PREFIXES: Record<string, string> = {
  rdf:   'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs:  'http://www.w3.org/2000/01/rdf-schema#',
  owl:   'http://www.w3.org/2002/07/owl#',
  xsd:   'http://www.w3.org/2001/XMLSchema#',
  dc:    'http://purl.org/dc/elements/1.1/',
  dcterms: 'http://purl.org/dc/terms/',
  foaf:  'http://xmlns.com/foaf/0.1/',
  skos:  'http://www.w3.org/2004/02/skos/core#',
  schema: 'http://schema.org/',
  prov:  'http://www.w3.org/ns/prov#',
  sh:    'http://www.w3.org/ns/shacl#',
};

/** Prepend declarations for any common prefix used but not declared. */
function injectMissingPrefixes(data: string): string {
  const declared = new Set(
    [...data.matchAll(/@prefix\s+(\w*):/gi)].map(m => m[1])
  );
  const missing = Object.entries(COMMON_PREFIXES)
    .filter(([prefix]) => !declared.has(prefix) && new RegExp(`\\b${prefix}:`).test(data))
    .map(([prefix, uri]) => `@prefix ${prefix}: <${uri}> .`)
    .join('\n');
  return missing ? missing + '\n' + data : data;
}

export class TurtleLoader {
  async load(data: string): Promise<Triple[]> {
    return new Promise((resolve, reject) => {
      const patched = injectMissingPrefixes(data);
      const parser = new N3.Parser({ format: 'Turtle' });
      const triples: Triple[] = [];
      try {
        parser.parse(patched, (error, quad) => {
          if (error) {
            // Retry with lenient format as fallback
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