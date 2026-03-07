/**
 * RDFS Reasoner - Implements RDFS entailment rules
 *
 * Rules implemented (W3C RDFS Semantics):
 * - rdfs2:  X P Y, P rdfs:domain D          -> X rdf:type D
 * - rdfs3:  X P Y, P rdfs:range R           -> Y rdf:type R  (if Y not Literal)
 * - rdfs5:  P subPropertyOf Q, Q subPropertyOf R -> P subPropertyOf R
 * - rdfs7:  X P Y, P subPropertyOf Q        -> X Q Y
 * - rdfs9:  X type C, C subClassOf D        -> X type D
 * - rdfs11: A subClassOf B, B subClassOf C  -> A subClassOf C
 */

import { InferredTriple, Triple, NamedNode } from '@kg/core';

const URI = {
    type: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
    subClassOf: 'http://www.w3.org/2000/01/rdf-schema#subClassOf',
    subPropertyOf: 'http://www.w3.org/2000/01/rdf-schema#subPropertyOf',
    domain: 'http://www.w3.org/2000/01/rdf-schema#domain',
    range: 'http://www.w3.org/2000/01/rdf-schema#range',
} as const;

function nn(uri: string): NamedNode {
    return { type: 'NamedNode', value: uri };
}

function tripleKey(s: string, p: string, o: string): string {
    return `${s}|${p}|${o}`;
}

function makeInferred(
    subject: Triple['subject'],
    predicate: NamedNode,
    object: Triple['object'],
    rule: string,
    sources: Triple[],
): InferredTriple {
    return { subject, predicate, object, inferred: true, rule, source: sources };
}

export class RDFSReasoner {
    /**
     * Perform RDFS reasoning using forward-chaining until fixed-point.
     * Returns all newly inferred triples (not present in baseTriples).
     */
    reason(baseTriples: Triple[]): InferredTriple[] {
        const known = new Set<string>(
            baseTriples.map((t) => tripleKey(t.subject.value, t.predicate.value, t.object.value)),
        );

        const allInferred: InferredTriple[] = [];
        let workset: Triple[] = [...baseTriples];

        let changed = true;
        while (changed) {
            changed = false;
            const round: InferredTriple[] = [];

            const byPred = this.groupByPredicate(workset);

            const tryAdd = (inf: InferredTriple) => {
                const key = tripleKey(inf.subject.value, inf.predicate.value, inf.object.value);
                if (!known.has(key)) {
                    known.add(key);
                    round.push(inf);
                    changed = true;
                }
            };

            // rdfs11: A subClassOf B, B subClassOf C -> A subClassOf C
            for (const t1 of byPred.get(URI.subClassOf) ?? []) {
                for (const t2 of byPred.get(URI.subClassOf) ?? []) {
                    if (t1.object.value === t2.subject.value && t1.subject.value !== t2.object.value) {
                        tryAdd(makeInferred(t1.subject, nn(URI.subClassOf), t2.object,
                            'rdfs11: subClassOf transitivity', [t1, t2]));
                    }
                }
            }

            // rdfs5: P subPropertyOf Q, Q subPropertyOf R -> P subPropertyOf R
            for (const t1 of byPred.get(URI.subPropertyOf) ?? []) {
                for (const t2 of byPred.get(URI.subPropertyOf) ?? []) {
                    if (t1.object.value === t2.subject.value && t1.subject.value !== t2.object.value) {
                        tryAdd(makeInferred(t1.subject, nn(URI.subPropertyOf), t2.object,
                            'rdfs5: subPropertyOf transitivity', [t1, t2]));
                    }
                }
            }

            // rdfs9: X type C, C subClassOf D -> X type D
            for (const typeTriple of byPred.get(URI.type) ?? []) {
                for (const sub of byPred.get(URI.subClassOf) ?? []) {
                    if (typeTriple.object.value === sub.subject.value) {
                        tryAdd(makeInferred(typeTriple.subject, nn(URI.type), sub.object,
                            'rdfs9: type propagation via subClassOf', [typeTriple, sub]));
                    }
                }
            }

            // rdfs2: X P Y, P rdfs:domain D -> X type D
            for (const domTriple of byPred.get(URI.domain) ?? []) {
                for (const usage of byPred.get(domTriple.subject.value) ?? []) {
                    tryAdd(makeInferred(usage.subject, nn(URI.type), domTriple.object,
                        'rdfs2: domain inference', [domTriple, usage]));
                }
            }

            // rdfs3: X P Y, P rdfs:range R -> Y type R (non-literal Y only)
            for (const rangeTriple of byPred.get(URI.range) ?? []) {
                for (const usage of byPred.get(rangeTriple.subject.value) ?? []) {
                    if (usage.object.type !== 'Literal') {
                        tryAdd(makeInferred(
                            usage.object as NamedNode,
                            nn(URI.type),
                            rangeTriple.object,
                            'rdfs3: range inference',
                            [rangeTriple, usage],
                        ));
                    }
                }
            }

            // rdfs7: X P Y, P subPropertyOf Q -> X Q Y
            for (const subProp of byPred.get(URI.subPropertyOf) ?? []) {
                if (subProp.object.type !== 'NamedNode') continue;
                for (const usage of byPred.get(subProp.subject.value) ?? []) {
                    tryAdd(makeInferred(usage.subject, subProp.object as NamedNode, usage.object,
                        'rdfs7: subProperty propagation', [subProp, usage]));
                }
            }

            allInferred.push(...round);
            workset = [...workset, ...round];
        }

        return allInferred;
    }

    private groupByPredicate(triples: Triple[]): Map<string, Triple[]> {
        const map = new Map<string, Triple[]>();
        for (const t of triples) {
            const p = t.predicate.value;
            if (!map.has(p)) map.set(p, []);
            map.get(p)!.push(t);
        }
        return map;
    }
}
