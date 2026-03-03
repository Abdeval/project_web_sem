import * as path from 'path';
import { RDFManager } from '../src/RDFManager';
import { GraphStats } from '../src/types';

const SAMPLE_TTL = path.resolve(__dirname, '../samples/pizza.ttl');

function printStats(stats: GraphStats, title: string): void {
  console.log('\n   ' + title);
  console.log('   - Total triples:     ' + stats.totalTriples);
  console.log('   - Unique subjects:   ' + stats.uniqueSubjects);
  console.log('   - Unique predicates: ' + stats.uniquePredicates);
  console.log('   - Unique objects:    ' + stats.uniqueObjects);
  console.log('   - Literals:          ' + stats.literalCount);
  console.log('   - IRIs:              ' + stats.iriCount);
  if (stats.topPredicates.length > 0) {
    console.log('   Top predicates:');
    stats.topPredicates.forEach((p, i) =>
      console.log('     ' + (i + 1) + '. ' + p.predicate + ' (' + p.count + ' occurrences)')
    );
  }
}

async function main(): Promise<void> {
  console.log('=== RDF I/O & Statistics Demo ===\n');
  const manager = new RDFManager();

  // 1. Load RDF/XML
  console.log('1. Loading Turtle file: ' + SAMPLE_TTL);
  let t0 = Date.now();
  await manager.loadFromFile(SAMPLE_TTL);
  console.log('   OK Loaded in ' + (Date.now() - t0) + 'ms');
  const stats0 = manager.getStats();
  printStats(stats0, 'Graph Statistics:');

  // 2. Export Turtle
  console.log('\n2. Export to Turtle');
  t0 = Date.now();
  const turtle = await manager.export('turtle');
  console.log('   OK Exported in ' + (Date.now() - t0) + 'ms');

  // 3. Re-import Turtle
  console.log('\n3. Re-import exported Turtle');
  manager.clear();
  t0 = Date.now();
  await manager.load(turtle, 'turtle');
  console.log('   OK Loaded in ' + (Date.now() - t0) + 'ms');

  // 4. Verify round-trip
  const stats1 = manager.getStats();
  console.log('\n4. Verify round-trip');
  console.log(stats0.totalTriples === stats1.totalTriples
    ? '   OK Graph structure preserved (' + stats1.totalTriples + ' triples)'
    : '   FAIL Mismatch! Before: ' + stats0.totalTriples + ', After: ' + stats1.totalTriples
  );

  // 5. Export RDF/XML
  console.log('\n5. Export to RDF/XML');
  t0 = Date.now();
  const rdfxml = await manager.export('rdfxml');
  console.log('   OK Exported in ' + (Date.now() - t0) + 'ms');

  // 6. Re-import RDF/XML
  console.log('\n6. Re-import exported RDF/XML');
  manager.clear();
  t0 = Date.now();
  await manager.load(rdfxml, 'rdfxml');
  const stats2 = manager.getStats();
  console.log('   OK Loaded in ' + (Date.now() - t0) + 'ms');
  console.log(stats0.totalTriples === stats2.totalTriples
    ? '   OK Graph structure preserved (' + stats2.totalTriples + ' triples)'
    : '   FAIL Mismatch! Before: ' + stats0.totalTriples + ', After: ' + stats2.totalTriples
  );

  // 7. Export N-Triples
  console.log('\n7. Export to N-Triples');
  t0 = Date.now();
  const nt = await manager.export('ntriples');
  console.log('   OK Exported in ' + (Date.now() - t0) + 'ms');

  // 8. Re-import N-Triples
  console.log('\n8. Re-import N-Triples');
  manager.clear();
  t0 = Date.now();
  await manager.load(nt, 'ntriples');
  const stats3 = manager.getStats();
  console.log('   OK Loaded in ' + (Date.now() - t0) + 'ms');
  console.log(stats0.totalTriples === stats3.totalTriples
    ? '   OK Graph structure preserved (' + stats3.totalTriples + ' triples)'
    : '   FAIL Mismatch! Before: ' + stats0.totalTriples + ', After: ' + stats3.totalTriples
  );

  // 9. Error handling
  console.log('\n9. Testing error handling (malformed Turtle)...');
  try {
    await manager.load('THIS IS NOT VALID TURTLE', 'turtle');
    console.log('   FAIL Should have thrown!');
  } catch (e: any) {
    console.log('   OK Error caught: ' + e.message.slice(0, 80));
  }

  console.log('\n=== Demo completed successfully ===');
}

main().catch((err) => {
  console.error('\nDemo failed:', err.message);
  process.exit(1);
});
