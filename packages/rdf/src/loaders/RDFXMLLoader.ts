import { graph, parse } from 'rdflib';
import { Triple } from '../types';

/** HTML presentation / event attributes that lack an XML namespace prefix.
 *  These make rdflib throw "No namespace for <attr>" even though the RDF data
 *  is otherwise valid. We strip them before the first parse attempt. */
const HTML_ATTRS = [
  'style', 'class', 'id', 'lang',
  'onclick', 'ondblclick', 'onmousedown', 'onmouseup', 'onmouseover',
  'onmousemove', 'onmouseout', 'onfocus', 'onblur',
  'onkeypress', 'onkeydown', 'onkeyup',
  'onload', 'onunload', 'onsubmit', 'onreset', 'onselect', 'onchange',
];

export class RDFXMLLoader {
  /** Strip bare HTML attributes (no namespace prefix) from XML elements */
  private preprocessXML(data: string): string {
    let result = data;
    for (const attr of HTML_ATTRS) {
      result = result
        .replace(new RegExp(` ${attr}="[^"]*"`, 'gi'), '')
        .replace(new RegExp(` ${attr}='[^']*'`, 'gi'), '');
    }
    return result;
  }

  private parseWith(data: string, baseURI: string): Promise<Triple[]> {
    return new Promise((resolve, reject) => {
      const store = graph();
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        parse(data, store, baseURI, 'application/rdf+xml', (err: any) => {
          const triples: Triple[] = [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          store.match(undefined, undefined, undefined).forEach((quad: any) => {
            triples.push({
              subject:   quad.subject.value,
              predicate: quad.predicate.value,
              object:    quad.object.value,
              isLiteral: quad.object.termType === 'Literal',
            });
          });
          if (err) {
            if (triples.length > 0) {
              // Non-fatal: partial parse succeeded — warn and continue
              console.warn(
                `[RDFXMLLoader] Non-fatal warning (recovered ${triples.length} triples):`,
                err.message ?? err,
              );
              resolve(triples);
            } else {
              reject(new Error('[RDFXMLLoader] Parse error: ' + (err.message ?? err)));
            }
          } else {
            resolve(triples);
          }
        });
      } catch (e: unknown) {
        reject(new Error('[RDFXMLLoader] Unexpected error: ' + (e instanceof Error ? e.message : String(e))));
      }
    });
  }

  async load(data: string, baseURI: string = 'https://example.org/'): Promise<Triple[]> {
    try {
      return await this.parseWith(data, baseURI);
    } catch (firstErr: unknown) {
      // First attempt failed — strip bare HTML attributes and retry
      const cleaned = this.preprocessXML(data);
      if (cleaned === data) throw firstErr; // nothing to clean
      try {
        console.warn('[RDFXMLLoader] Retrying parse after stripping HTML attributes…');
        return await this.parseWith(cleaned, baseURI);
      } catch {
        throw firstErr; // re-throw the original, more descriptive error
      }
    }
  }
}
