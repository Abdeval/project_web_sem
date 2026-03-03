import * as path from 'path';
import { RDFManager } from '../src/RDFManager';
import { GraphStats } from '../src/types';

const SAMPLE_TTL = path.resolve(__dirname, '../samples/pizza.ttl');

function printStats(stats: GraphStats, title: string): void {
  console.log('\n?? ' + title);
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

  console.log('1. Loading Turtle file: ' + SAMPLE_TTL);
  let t0 = Date.now();
  await manager.loadFromFile(SAMPLE_TTL);
  console.log('   OK Loaded in ' + (Date.now() - t0) + 'ms');
  const stats0 = manager.getStats();
  printStats(stats0, 'Initial graph stats');

  console.log('\n2. Exporting to RDF/XML...');
  t0 = Date.now();
  const rdfxml = await manager.export('rdfxml');
  console.log('   OK Exported in ' + (Date.now() - t0) + 'ms (' + rdfxml.length + ' chars)');

  console.log('\n3. Re-importing exported RDF/XML...');
  manager.clear();
  t0 = Date.now();
  await manager.load(rdfxml, 'rdfxml');
  console.log('   OK Loaded in ' + (Date.now() - t0) + 'ms');

  const stats1 = manager.getStats();
  console.log('\n4. Verifying Turtle to RDF/XML round-trip...');
  console.log(stats0.totalTriples === stats1.totalTriples
    ? '   OK Graph structure preserved (' + stats1.totalTriples + ' triples)'
    : '   FAIL Mismatch! Before: ' + stats0.totalTriples + ', After: ' + stats1.totalTriples
  );

  console.log('\n5. Exporting to N-Triples...');
  t0 = Date.now();
  const nt = await manager.export('ntriples');
  console.log('   OK Exported in ' + (Date.now() - t0) + 'ms');

  console.log('\n6. Re-importing N-Triples...');
  manager.clear();
  t0 = Date.now();
  await manager.load(nt, 'ntriples');
  const stats2 = manager.getStats();
  console.log('   OK Loaded in ' + (Date.now() - t0) + 'ms');
  console.log(stats0.totalTriples === stats2.totalTriples
    ? '   OK N-Triples round-trip preserved (' + stats2.totalTriples + ' triples)'
    : '   FAIL Mismatch! Before: ' + stats0.totalTriples + ', After: ' + stats2.totalTriples
  );

  console.log('\n7. Testing error handling (malformed Turtle)...');
  try {
    await manager.load('THIS IS NOT VALID TURTLE', 'turtle');
    console.log('   FAIL Should have thrown an error!');
  } catch (e: any) {
    console.log('   OK Error caught correctly: ' + e.message.slice(0, 80));
  }

  console.log('\n=== Demo completed successfully ===');
}

main().catch((err) => {
  console.error('\nDemo failed:', err.message);
  process.exit(1);
});
