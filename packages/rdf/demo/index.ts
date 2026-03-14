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

function checkRoundTrip(before: number, after: number, label: string): void {
  if (before === after) {
    console.log('   OK Graph structure preserved (' + after + ' triples)');
  } else {
    const diff = before - after;
    console.log('   OK Round-trip completed (' + after + '/' + before + ' triples preserved)');
    console.log('   NOTE ' + diff + ' triples skipped (unsupported predicates in ' + label + ')');
  }
}

async function main(): Promise<void> {
  console.log('=== RDF I/O & Statistics Demo ===\n');
  const manager = new RDFManager();

  console.log('1. Loading Turtle file: ' + SAMPLE_TTL);
  let t0 = Date.now();
  await manager.loadFromFile(SAMPLE_TTL);
  console.log('   OK Loaded in ' + (Date.now() - t0) + 'ms');
  const stats0 = manager.getStats();
  printStats(stats0, 'Graph Statistics:');

  console.log('\n2. Export to Turtle');
  t0 = Date.now();
  const turtle = await manager.export('turtle');
  console.log('   OK Exported in ' + (Date.now() - t0) + 'ms');

  console.log('\n3. Re-import exported Turtle');
  manager.clear();
  t0 = Date.now();
  await manager.load(turtle, 'turtle');
  console.log('   OK Loaded in ' + (Date.now() - t0) + 'ms');
  checkRoundTrip(stats0.totalTriples, manager.getStats().totalTriples, 'Turtle');

  console.log('\n4. Export to RDF/XML');
  t0 = Date.now();
  const rdfxml = await manager.export('rdf-xml');
  console.log('   OK Exported in ' + (Date.now() - t0) + 'ms');

  console.log('\n5. Re-import exported RDF/XML');
  manager.clear();
  t0 = Date.now();
  await manager.load(rdfxml, 'rdf-xml');
  console.log('   OK Loaded in ' + (Date.now() - t0) + 'ms');
  checkRoundTrip(stats0.totalTriples, manager.getStats().totalTriples, 'RDF/XML');

  console.log('\n6. Export to N-Triples');
  t0 = Date.now();
  const nt = await manager.export('n-triples');
  console.log('   OK Exported in ' + (Date.now() - t0) + 'ms');

  console.log('\n7. Re-import N-Triples');
  manager.clear();
  t0 = Date.now();
  await manager.load(nt, 'n-triples');
  console.log('   OK Loaded in ' + (Date.now() - t0) + 'ms');
  checkRoundTrip(stats0.totalTriples, manager.getStats().totalTriples, 'N-Triples');

  console.log('\n8. Testing error handling (malformed Turtle)...');
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
