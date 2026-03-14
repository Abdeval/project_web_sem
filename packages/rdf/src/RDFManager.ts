import type { IRDFStore, Triple as CoreTriple, GraphStats, RDFFormat, PrefixMap } from '@kg/core';
import { Triple as RawTriple, RDFFormat as LocalRDFFormat } from './types';
import { TurtleLoader }     from './loaders/TurtleLoader';
import { NTriplesLoader }   from './loaders/NTriplesLoader';
import { RDFXMLLoader }     from './loaders/RDFXMLLoader';
import { TurtleExporter }   from './exporters/TurtleExporter';
import { NTriplesExporter } from './exporters/NTriplesExporter';
import { RDFXMLExporter }   from './exporters/RDFXMLExporter';
import { GraphStatistics }  from './stats/GraphStatistics';

const LARGE_FILE_THRESHOLD = 1000000;

/** Convert flat string triple → @kg/core structured Triple */
function flatToCore(t: RawTriple): CoreTriple {
    const subject: CoreTriple['subject'] = t.subject.startsWith('_:')
        ? { type: 'BlankNode', value: t.subject }
        : { type: 'NamedNode', value: t.subject };
    const predicate: CoreTriple['predicate'] = { type: 'NamedNode', value: t.predicate };
    const object: CoreTriple['object'] = t.isLiteral
        ? { type: 'Literal', value: t.object }
        : t.object.startsWith('_:')
            ? { type: 'BlankNode', value: t.object }
            : { type: 'NamedNode', value: t.object };
    return { subject, predicate, object };
}

/** Convert @kg/core Triple → internal flat format */
function coreToFlat(t: CoreTriple): RawTriple {
    return {
        subject: t.subject.value,
        predicate: t.predicate.value,
        object: t.object.value,
        isLiteral: t.object.type === 'Literal',
    };
}

/** Normalize format names — accept both @kg/core and local variants */
function normalizeFormat(format: string): LocalRDFFormat {
    switch (format) {
        case 'rdf-xml':   return 'rdfxml';
        case 'n-triples': return 'ntriples';
        case 'turtle':    return 'turtle';
        case 'rdfxml':    return 'rdfxml';
        case 'ntriples':  return 'ntriples';
        default: throw new Error('[RDFManager] Unsupported format: ' + format);
    }
}

export class RDFManager implements IRDFStore {
  private rawTriples: RawTriple[] = [];
  private prefixes: PrefixMap = {};
  private readonly turtleLoader     = new TurtleLoader();
  private readonly ntriplesLoader   = new NTriplesLoader();
  private readonly rdfxmlLoader     = new RDFXMLLoader();
  private readonly turtleExporter   = new TurtleExporter();
  private readonly ntriplesExporter = new NTriplesExporter();
  private readonly rdfxmlExporter   = new RDFXMLExporter();
  private readonly statsEngine      = new GraphStatistics();

  async load(data: string, format: RDFFormat, _baseURI?: string): Promise<void> {
    const local = normalizeFormat(format as string);
    let loaded: RawTriple[];
    switch (local) {
      case 'turtle':   loaded = await this.turtleLoader.load(data); break;
      case 'ntriples': loaded = await this.ntriplesLoader.load(data); break;
      case 'rdfxml':   loaded = await this.rdfxmlLoader.load(data); break;
      default: throw new Error('[RDFManager] Unsupported format: ' + format);
    }

    for (const triple of loaded) {
      if (!triple.isLiteral) {
        this.validateURI(triple.subject);
        this.validateURI(triple.predicate);
        this.validateURI(triple.object);
      }
    }

    this.rawTriples.push(...loaded);
    if (this.rawTriples.length > LARGE_FILE_THRESHOLD) {
      console.warn('Warning: ' + this.rawTriples.length + ' triples loaded (> 1,000,000)');
    }
  }

  async loadFromFile(filePath: string): Promise<void> {
    const format = this.detectFormat(filePath);
    // require() inside the function body keeps fs out of Vite's static analysis,
    // so this module can be safely bundled for the Electron renderer process.
    // This method is only called from Node.js contexts (main process, CLI, tests).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeFs = require('fs') as typeof import('fs');
    if (!nodeFs.existsSync(filePath)) {
      throw new Error('[RDFManager] File not found: ' + filePath);
    }
    const data = nodeFs.readFileSync(filePath, { encoding: 'utf-8' });
    await this.load(data, format as unknown as RDFFormat);
  }

  async export(format: RDFFormat): Promise<string> {
    const local = normalizeFormat(format as string);
    switch (local) {
      case 'turtle':   return this.turtleExporter.export(this.rawTriples);
      case 'ntriples': return this.ntriplesExporter.export(this.rawTriples);
      case 'rdfxml':   return this.rdfxmlExporter.export(this.rawTriples);
      default: throw new Error('[RDFManager] Unsupported export format: ' + format);
    }
  }

  async exportToFile(filePath: string, format: RDFFormat): Promise<void> {
    const content = await this.export(format);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeFs = require('fs') as typeof import('fs');
    nodeFs.writeFileSync(filePath, content, 'utf-8');
  }

  getStats(): GraphStats {
    const raw = this.statsEngine.compute(this.rawTriples);
    const blankNodeCount = this.rawTriples.filter(
      t => t.subject.startsWith('_:') || (!t.isLiteral && t.object.startsWith('_:')),
    ).length;
    return { ...raw, blankNodeCount } as GraphStats;
  }

  getTriples(): CoreTriple[] { return this.rawTriples.map(flatToCore); }

  addTriple(triple: CoreTriple): void {
    this.rawTriples.push(coreToFlat(triple));
  }

  removeTriple(triple: CoreTriple): boolean {
    const flat = coreToFlat(triple);
    const idx = this.rawTriples.findIndex(
      t => t.subject === flat.subject && t.predicate === flat.predicate && t.object === flat.object,
    );
    if (idx === -1) return false;
    this.rawTriples.splice(idx, 1);
    return true;
  }

  clear(): void { this.rawTriples = []; }

  getPrefixes(): PrefixMap { return { ...this.prefixes }; }
  registerPrefix(prefix: string, uri: string): void { this.prefixes[prefix] = uri; }

  private validateURI(uri: string): void {
    if (uri.startsWith('_:')) return;           // blank node standard
    if (/^n3-\d+$/.test(uri)) return;           // blank node N3.js interne
    if (/^b0_genid\d+$/.test(uri)) return;      // blank node rdflib interne
    if (/^[a-z][a-z0-9+\-.]*:/i.test(uri)) return; // IRI valide
    if (/\s/.test(uri)) {
      console.warn('[RDFManager] Warning: URI contains whitespace: ' + uri);
     } else {
       console.warn('[RDFManager] Warning: Invalid URI: ' + uri);
    }
}
  private detectFormat(filePath: string): LocalRDFFormat {
    const parts = filePath.split('.');
    const ext = (parts.pop() ?? '').toLowerCase();
    switch (ext) {
      case 'ttl':  return 'turtle';
      case 'nt':   return 'ntriples';
      case 'rdf':
      case 'owl':
      case 'xml':  return 'rdfxml';
      default: throw new Error('[RDFManager] Unknown extension ".' + ext + '". Supported: .ttl .nt .rdf .owl .xml');
    }
  }
}
