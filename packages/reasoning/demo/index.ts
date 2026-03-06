/**
 * Reasoning Module Demo
 * Tests RDFS and OWL RL inference with family.ttl + inline OWL data
 */

import * as path from 'path';
import { ReasoningEngine } from '../src';
import { RDFStore } from '@kg/core';

function label(uri: string): string {
    return uri.split(/[#/]/).pop() ?? uri;
}

async function main() {
    console.log('╔══════════════════════════════════════╗');
    console.log('║     Reasoning Engine Demo             ║');
    console.log('╚══════════════════════════════════════╝\n');

    // ── 1. RDFS Reasoning ────────────────────────────────────────────────────
    console.log('═══ Part 1 : RDFS Reasoning ═══\n');

    const familyPath = path.resolve(__dirname, '../../../assets/samples/family.ttl');
    const rdfsStore = new RDFStore();
    await rdfsStore.loadFromFile(familyPath);

    const before = rdfsStore.getStats().totalTriples;
    console.log(`Loaded ${before} asserted triples from family.ttl\n`);

    const rdfsReasoner = new ReasoningEngine();
    rdfsReasoner.configure({ enabled: true, mode: 'RDFS', includeInferred: false });

    const rdfsResult = await rdfsReasoner.infer(rdfsStore);
    console.log(`RDFS inference: +${rdfsResult.totalInferences} triples  (${rdfsResult.executionTime}ms)\n`);

    console.log('Sample inferred triples:');
    rdfsResult.inferredTriples.slice(0, 10).forEach((t, i) => {
        console.log(`  ${(i + 1).toString().padStart(2)}. ${label(t.subject.value).padEnd(12)} ${label(t.predicate.value).padEnd(18)} ${label(t.object.value)}`);
        console.log(`      └─ rule: ${t.rule}`);
    });
    if (rdfsResult.totalInferences > 10) {
        console.log(`  ... and ${rdfsResult.totalInferences - 10} more`);
    }

    // Verify: John is a Father -> should infer John is Man, Parent, Person
    const johnInferences = rdfsResult.inferredTriples.filter(
        (t) => t.subject.value.includes('John') && t.predicate.value.includes('type'),
    );
    console.log(`\nVerification — John's inferred types:`);
    johnInferences.forEach((t) => console.log(`  • ${label(t.object.value)}  (via ${t.rule})`));

    // ── 2. OWL RL Reasoning ──────────────────────────────────────────────────
    console.log('\n═══ Part 2 : OWL RL Reasoning ═══\n');

    const owlData = `
@prefix :    <http://example.org/owl#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs:<http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .

# owl:inverseOf test
:knows    a   owl:ObjectProperty .
:knownBy  a   owl:ObjectProperty ;
          owl:inverseOf :knows .

# owl:SymmetricProperty test
:friendOf a owl:SymmetricProperty .

# owl:TransitiveProperty test
:ancestorOf a owl:TransitiveProperty .

# Assertions
:Alice  :knows      :Bob .
:Alice  :friendOf   :Charlie .
:Alice  :ancestorOf :Bob .
:Bob    :ancestorOf :Carl .

# owl:equivalentClass test
:Human  owl:equivalentClass :Person .
:Person rdfs:subClassOf rdfs:Resource .
:Alice  rdf:type :Human .
`;

    const owlStore = new RDFStore();
    await owlStore.load(owlData, 'turtle');

    const owlReasoner = new ReasoningEngine();
    owlReasoner.configure({ enabled: true, mode: 'OWL_RL', includeInferred: false });

    const owlResult = await owlReasoner.infer(owlStore);
    console.log(`OWL RL inference: +${owlResult.totalInferences} triples  (${owlResult.executionTime}ms)\n`);

    console.log('Sample inferred triples:');
    owlResult.inferredTriples.slice(0, 15).forEach((t, i) => {
        console.log(`  ${(i + 1).toString().padStart(2)}. ${label(t.subject.value).padEnd(12)} ${label(t.predicate.value).padEnd(20)} ${label(t.object.value)}`);
        console.log(`      └─ rule: ${t.rule}`);
    });

    // ── 3. Toggle and supported modes ────────────────────────────────────────
    console.log('\n═══ Part 3 : Toggle & Modes ═══\n');
    console.log('Supported modes:', rdfsReasoner.getSupportedModes().join(', '));

    rdfsReasoner.setEnabled(false);
    const noResult = await rdfsReasoner.infer(rdfsStore);
    console.log(`Reasoning OFF: ${noResult.totalInferences} inferences (expected 0)`);

    // ── 4. Stats comparison ───────────────────────────────────────────────────
    console.log('\n═══ Summary ═══\n');
    console.log(`family.ttl: ${before} asserted → +${rdfsResult.totalInferences} inferred (RDFS)`);
    console.log(`owl test  : ${owlStore.getStats().totalTriples} asserted → +${owlResult.totalInferences} inferred (OWL RL)`);
    console.log('\n✅ Demo completed successfully');
}

main().catch(console.error);

