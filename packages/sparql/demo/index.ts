/**
 * SPARQL Module Demo - Full demonstration
 *
 * Run: npm run demo:sparql
 */

import { QueryManager } from '../src';
import { RDFStore } from '@kg/core';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('=== SPARQL Query Engine Demo ===\n');

  // ── 1. Setup ──────────────────────────────────────────────
  const store = new RDFStore();
  const manager = new QueryManager();

  const foafData = `
@prefix : <http://example.org/> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .

:Alice   foaf:name "Alice"   ; foaf:mbox "alice@example.com"   ; foaf:age "30"^^xsd:integer .
:Bob     foaf:name "Bob"     ; foaf:mbox "bob@example.com"     ; foaf:age "25"^^xsd:integer .
:Charlie foaf:name "Charlie" ; foaf:mbox "charlie@example.com" ; foaf:age "35"^^xsd:integer .
`;

  console.log('1. Loading RDF data (FOAF graph)...');
  await store.load(foafData, 'turtle');
  const stats = store.getStats();
  console.log(`   ✓ Loaded ${stats.totalTriples} triples\n`);

  // ── 2. SELECT query ───────────────────────────────────────
  console.log('2. Query 1: SELECT ?name ?email');
  const selectQuery = `
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
SELECT ?name ?email
WHERE {
    ?person foaf:name ?name .
    ?person foaf:mbox ?email .
}
ORDER BY ?name
`;

  const validation = manager.validate(selectQuery);
  console.log(`   Syntax: ${validation.valid ? '✓ valid' : '✗ invalid: ' + validation.error}`);

  const selectResult = await manager.execute(selectQuery, store);
  console.log('\n   Results:');
  console.log(
    manager
      .formatResult(selectResult)
      .split('\n')
      .map((l) => '   ' + l)
      .join('\n')
  );
  console.log(`\n   ✓ Executed in ${selectResult.executionTime}ms\n`);

  // ── 3. ASK query ──────────────────────────────────────────
  console.log('3. Query 2: ASK for "Alice"');
  const askQuery = `
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
ASK {
    ?person foaf:name "Alice" .
}
`;
  const askResult = await manager.execute(askQuery, store);
  console.log(`   ${manager.formatResult(askResult)}`);
  console.log(`   ✓ Executed in ${askResult.executionTime}ms\n`);

  // ── 4. ASK (negative) ─────────────────────────────────────
  console.log('4. Query 3: ASK for "Zara" (should be false)');
  const askFalseResult = await manager.execute(
    `PREFIX foaf: <http://xmlns.com/foaf/0.1/> ASK { ?p foaf:name "Zara" . }`,
    store
  );
  console.log(`   ${manager.formatResult(askFalseResult)}`);
  console.log(`   ✓ Executed in ${askFalseResult.executionTime}ms\n`);

  // ── 5. CONSTRUCT query ────────────────────────────────────
  console.log('5. Query 4: CONSTRUCT name triples');
  const constructQuery = `
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
CONSTRUCT {
    ?person foaf:name ?name .
}
WHERE {
    ?person foaf:name ?name .
}
`;
  const constructResult = await manager.execute(constructQuery, store);
  console.log(
    manager
      .formatResult(constructResult)
      .split('\n')
      .map((l) => '   ' + l)
      .join('\n')
  );
  console.log(`\n   ✓ Executed in ${constructResult.executionTime}ms\n`);

  // ── 6. Export to CSV ──────────────────────────────────────
  console.log('6. Export SELECT result to CSV...');
  const csv = await manager.exportResult(selectResult, 'csv');
  const outputDir = path.join(__dirname, '..', 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const csvPath = path.join(outputDir, 'results.csv');
  fs.writeFileSync(csvPath, csv, 'utf-8');
  console.log(`   ✓ Exported to output/results.csv`);
  console.log(`   CSV content:\n${csv.split('\n').map((l) => '   ' + l).join('\n')}\n`);

  // ── 7. Export to JSON ─────────────────────────────────────
  console.log('7. Export SELECT result to JSON (SPARQL Results Format)...');
  const json = await manager.exportResult(selectResult, 'json');
  const jsonPath = path.join(outputDir, 'results.json');
  fs.writeFileSync(jsonPath, json, 'utf-8');
  console.log(`   ✓ Exported to output/results.json`);
  console.log(`   JSON preview: ${json.slice(0, 120)}...\n`);

  // ── 8. Export to XML ──────────────────────────────────────
  console.log('8. Export SELECT result to XML (SPARQL Results Format)...');
  const xml = await manager.exportResult(selectResult, 'xml');
  const xmlPath = path.join(outputDir, 'results.xml');
  fs.writeFileSync(xmlPath, xml, 'utf-8');
  console.log(`   ✓ Exported to output/results.xml\n`);

  // ── 9. Query History ──────────────────────────────────────
  console.log('9. Query History:');
  const history = manager.getHistory();
  console.log(`   Total queries executed: ${history.length}`);
  history.forEach((h, i) => {
    const preview = h.query.replace(/\s+/g, ' ').slice(0, 60);
    console.log(`   [${i + 1}] (${h.result.type}) ${preview}...`);
  });

  // Replay first query
  const firstEntry = history[history.length - 1];
  manager.replayFromHistory(firstEntry.id);
  console.log(`\n   Replaying entry #${history.length}: query retrieved ✓\n`);

  // ── 10. Auto-completion demo ───────────────────────────────
  console.log('10. Auto-completion suggestions (context: "PREFIX "):');
  const completions = manager.getCompletions('PREFIX ', 7);
  const prefixSuggestions = completions.filter((c) => c.kind === 'prefix').slice(0, 4);
  prefixSuggestions.forEach((c) => console.log(`   → ${c.label}`));

  console.log('\n=== Demo completed successfully ===');
}

main().catch((err) => {
  console.error('Demo failed:', err);
  process.exit(1);
});
