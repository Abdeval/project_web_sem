import { Triple, GraphStats } from '../types';

export class GraphStatistics {
  compute(triples: Triple[]): GraphStats {
    const subjects   = new Set<string>();
    const predicates = new Set<string>();
    const objects    = new Set<string>();
    const predCount  = new Map<string, number>();
    let literalCount = 0;
    let iriCount     = 0;

    for (const t of triples) {
      subjects.add(t.subject);
      predicates.add(t.predicate);
      objects.add(t.object);
      if (t.isLiteral) literalCount++;
      else             iriCount++;
      predCount.set(t.predicate, (predCount.get(t.predicate) ?? 0) + 1);
    }

    const topPredicates = Array.from(predCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([predicate, count]) => ({ predicate, count }));

    return {
      totalTriples:     triples.length,
      uniqueSubjects:   subjects.size,
      uniquePredicates: predicates.size,
      uniqueObjects:    objects.size,
      literalCount,
      iriCount,
      topPredicates,
    };
  }
}