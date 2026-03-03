import * as fs   from 'fs';
import * as path from 'path';
import { Triple, GraphStats, RDFFormat, IRDFStore } from './types';
import { TurtleLoader }     from './loaders/TurtleLoader';
import { NTriplesLoader }   from './loaders/NTriplesLoader';
import { RDFXMLLoader }     from './loaders/RDFXMLLoader';
import { TurtleExporter }   from './exporters/TurtleExporter';
import { NTriplesExporter } from './exporters/NTriplesExporter';
import { RDFXMLExporter }   from './exporters/RDFXMLExporter';
import { GraphStatistics }  from './stats/GraphStatistics';

const LARGE_FILE_THRESHOLD = 1000000;

export class RDFManager implements IRDFStore {
  private triples: Triple[] = [];
  private readonly turtleLoader     = new TurtleLoader();
  private readonly ntriplesLoader   = new NTriplesLoader();
  private readonly rdfxmlLoader     = new RDFXMLLoader();
  private readonly turtleExporter   = new TurtleExporter();
  private readonly ntriplesExporter = new NTriplesExporter();
  private readonly rdfxmlExporter   = new RDFXMLExporter();
  private readonly statsEngine      = new GraphStatistics();

  async load(data: string, format: RDFFormat): Promise<void> {
    let loaded: Triple[];
    switch (format) {
      case 'turtle':   loaded = await this.turtleLoader.load(data); break;
      case 'ntriples': loaded = await this.ntriplesLoader.load(data); break;
      case 'rdfxml':   loaded = await this.rdfxmlLoader.load(data); break;
      default: throw new Error('[RDFManager] Unsupported format: ' + format);
    }
    this.triples.push(...loaded);
    if (this.triples.length > LARGE_FILE_THRESHOLD) {
      console.warn('Warning: ' + this.triples.length + ' triples loaded (> 1,000,000)');
    }
  }

  async loadFromFile(filePath: string): Promise<void> {
    const format = this.detectFormat(filePath);
    if (!fs.existsSync(filePath)) {
      throw new Error('[RDFManager] File not found: ' + filePath);
    }
    const data = fs.readFileSync(filePath, { encoding: 'utf-8' });
    await this.load(data, format);
  }

  async export(format: RDFFormat): Promise<string> {
    switch (format) {
      case 'turtle':   return this.turtleExporter.export(this.triples);
      case 'ntriples': return this.ntriplesExporter.export(this.triples);
      case 'rdfxml':   return this.rdfxmlExporter.export(this.triples);
      default: throw new Error('[RDFManager] Unsupported export format: ' + format);
    }
  }

  getStats(): GraphStats { return this.statsEngine.compute(this.triples); }
  getTriples(): Triple[] { return [...this.triples]; }
  clear(): void          { this.triples = []; }

  private detectFormat(filePath: string): RDFFormat {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.ttl':  return 'turtle';
      case '.nt':   return 'ntriples';
      case '.rdf':
      case '.owl':
      case '.xml':  return 'rdfxml';
      default: throw new Error('[RDFManager] Unknown extension "' + ext + '". Supported: .ttl .nt .rdf .owl .xml');
    }
  }
}
