export type RDFFormat = 'turtle' | 'rdfxml' | 'ntriples';

export interface Triple {
  subject: string;
  predicate: string;
  object: string;
  isLiteral: boolean;
}

export interface GraphStats {
  totalTriples: number;
  uniqueSubjects: number;
  uniquePredicates: number;
  uniqueObjects: number;
  literalCount: number;
  iriCount: number;
  topPredicates: Array<{ predicate: string; count: number }>;
}

export interface IRDFStore {
  load(data: string, format: RDFFormat): Promise<void>;
  loadFromFile(filePath: string): Promise<void>;
  export(format: RDFFormat): Promise<string>;
  getStats(): GraphStats;
  getTriples(): Triple[];
  clear(): void;
}
