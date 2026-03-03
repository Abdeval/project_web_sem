import { Triple } from '../types';

export class RDFXMLExporter {
  private readonly nsMap: Record<string, string> = {
    'http://www.w3.org/1999/02/22-rdf-syntax-ns#': 'rdf',
    'http://www.w3.org/2000/01/rdf-schema#': 'rdfs',
    'http://www.w3.org/2002/07/owl#': 'owl',
    'http://www.w3.org/2001/XMLSchema#': 'xsd',
    'http://www.w3.org/2004/02/skos/core#': 'skos',
    'http://purl.org/dc/elements/1.1/': 'dc',
    'http://purl.org/dc/terms/': 'dcterms',
    'http://xmlns.com/foaf/0.1/': 'foaf',
    'http://www.co-ode.org/ontologies/pizza/pizza.owl#': 'pizza',
    'http://purl.org/vocab/vann/': 'vann',
    'http://creativecommons.org/ns#': 'cc',
  };

  async export(triples: Triple[]): Promise<string> {
    const extraNs = this.collectExtraNs(triples);
    const lines: string[] = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push('<rdf:RDF');
    for (const [ns, prefix] of Object.entries(this.nsMap)) {
      lines.push('  xmlns:' + prefix + '="' + ns + '"');
    }
    for (const [ns, prefix] of Object.entries(extraNs)) {
      lines.push('  xmlns:' + prefix + '="' + ns + '"');
    }
    lines.push('>');

    const allNs = { ...this.nsMap, ...extraNs };
    const bySubject = new Map<string, Array<{ predicate: string; object: string; isLiteral: boolean }>>();
    for (const t of triples) {
      if (!bySubject.has(t.subject)) bySubject.set(t.subject, []);
      bySubject.get(t.subject)!.push({ predicate: t.predicate, object: t.object, isLiteral: t.isLiteral });
    }

    for (const [subject, preds] of bySubject.entries()) {
      if (subject.startsWith('_:')) {
        lines.push('  <rdf:Description rdf:nodeID="' + this.escapeXml(subject.slice(2)) + '">');
      } else {
        lines.push('  <rdf:Description rdf:about="' + this.escapeXml(subject) + '">');
      }
      for (const { predicate, object, isLiteral } of preds) {
        const tag = this.iriToTag(predicate, allNs);
        if (!tag) continue;
        if (isLiteral) {
          const cleaned = this.escapeXml(object.replace(/\r?\n/g, ' ').replace(/\t/g, ' ').trim());
          lines.push('    <' + tag + '>' + cleaned + '</' + tag + '>');
        } else if (object.startsWith('_:')) {
          lines.push('    <' + tag + ' rdf:nodeID="' + this.escapeXml(object.slice(2)) + '"/>');
        } else {
          lines.push('    <' + tag + ' rdf:resource="' + this.escapeXml(object) + '"/>');
        }
      }
      lines.push('  </rdf:Description>');
    }

    lines.push('</rdf:RDF>');
    return lines.join('\n');
  }

  private collectExtraNs(triples: Triple[]): Record<string, string> {
    const extra: Record<string, string> = {};
    let counter = 0;
    for (const t of triples) {
      const ns = this.extractNs(t.predicate);
      if (ns && !this.nsMap[ns] && !extra[ns]) {
        extra[ns] = 'ns' + (counter++);
      }
    }
    return extra;
  }

  private extractNs(iri: string): string | null {
    const hash = iri.lastIndexOf('#');
    if (hash >= 0) return iri.slice(0, hash + 1);
    const slash = iri.lastIndexOf('/');
    if (slash >= 0) return iri.slice(0, slash + 1);
    return null;
  }

  private iriToTag(iri: string, nsMap: Record<string, string>): string | null {
    for (const [ns, prefix] of Object.entries(nsMap)) {
      if (iri.startsWith(ns)) {
        const local = iri.slice(ns.length);
        if (local && /^[a-zA-Z_][\w.-]*$/.test(local)) {
          return prefix + ':' + local;
        }
      }
    }
    return null;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
